import { formatMoney } from "/helpers.js";
import * as c from "/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["dry-run", false]]);
	const database = JSON.parse(ns.read("database.txt"));
	const factionGoals = [];
	for (var faction of ns.getPlayer().factions) {
		factionGoals.push({
			...database.factions.find(a => a.name == faction),
			reputation: 0,
			aim: ""
		});
	}
	var toPurchase = getAugmentationsToPurchase(ns, database, factionGoals);
	// ns.tprintf("Faction Goals start: %s", JSON.stringify(factionGoals));
	var augmentationCost = estimatePrice(toPurchase);
	// ns.tprintf("Estimated Cost: %s", formatMoney(augmentationCost));
	while (Math.max(1e8, ns.getServerMoneyAvailable("home")) > augmentationCost) {
		var nextAug = findNextAugmentation(ns, database, factionGoals);
		// ns.tprintf("Next Aug: %30s %10s %10d %s",
		// 	nextAug.name, formatMoney(nextAug.price), nextAug.reputation,
		// 	nextAug.faction.name);
		if (!nextAug || nextAug == undefined) {
			break;
		}
		var existing = factionGoals.find(a => a.name == nextAug.faction.name);
		if (existing) {
			existing.reputation = Math.max(existing.reputation, nextAug.reputation);
			existing.aim = nextAug.name;
		} else {
			factionGoals.push({
				...nextAug.faction,
				reputation: nextAug.reputation,
				aim: nextAug.name
			});
			// a new goal. Check if existing goals have become obsolete.
			var additionalAugs = database.augmentations.
				filter(a=>nextAug.faction.augmentations.includes(a)).
				filter(a=>a.reputation<=nextAug.reputation && a.name != nextAug.name);
			for (var addAug of additionalAugs) {
				for (var goal of factionGoals) {
					if (goal.aim == addAug.name) {
						goal.aim = "";
						goal.reputation = 0;
					}
				}
			}
		}
		toPurchase = getAugmentationsToPurchase(ns, database, factionGoals);
		augmentationCost = estimatePrice(toPurchase);
		// ns.tprintf("Estimated Cost: %s", formatMoney(augmentationCost));
		// ns.tprintf("Faction Goals: %s", JSON.stringify(factionGoals));
		// await ns.sleep(3000);
	}
	// ns.printf("Goals: %s", JSON.stringify(factionGoals));
	// ns.tprintf("Estimated Cost: %s", formatMoney(augmentationCost));
	do {
		var futureFactions = getPossibleFactions(ns, database, factionGoals).
			filter(a => !factionGoals.some(b => b.name == a.name));
		var foundOne = false;
		for (var faction of futureFactions) {
			if (faction.augmentations.some(a => !toPurchase.some(b => b.name == a))) {
				factionGoals.push({ ...faction, reputation:0, aim:""});
				foundOne = true;
				break;
			}
		}
	} while (foundOne);
	var result = JSON.stringify({
		factionGoals: factionGoals,
		estimatedPrice: augmentationCost,
		estimatedDonations: estimateDonations(ns, database, factionGoals)
	});
	if (options["dry-run"]) {
		ns.run("print_goals.js", 1, "--direct", result);
	} else {
		await ns.write("nodestart.txt", result, "w");
	}
}

/** @param {NS} ns **/
function getAugmentationsToPurchase(ns, database, factionGoals) {
	const toPurchase = [];
	for (var goal of factionGoals) {
		for (var augName of goal.augmentations) {
			var augmentation = database.augmentations.find(a => a.name == augName);
			var rep = goal.reputation;
			if (rep == undefined) {
				rep = ns.getFactionRep(goal.name);
			} else {
				rep = Math.max(rep, ns.getFactionRep(goal.name));
			}
			if (augmentation.reputation <= rep) {
				if (!toPurchase.includes(augmentation)) {
					toPurchase.push(augmentation);
					// ns.tprintf("Aug(%s): %s", goal.name, augName);
				}
			}
		}
	}
	toPurchase.sort((a, b) => a.price - b.price).reverse();
	return toPurchase;
}

/** @param {NS} ns **/
function estimatePrice(toPurchase) {
	var sum = 0;
	var factor = 1.0;
	for (var augmentation of toPurchase) {
		var toPay = factor * augmentation.price;
		sum += toPay;
		factor = factor * 1.9;
	}
	return sum;
}

/** @param {NS} ns **/
function costToGet(ns, database, factionGoals, augmentation) {
	const player = ns.getPlayer();
	var bestFactionCost = 1e9;
	var bestFaction = "";
	for (var factionName of augmentation.factions) {
		var faction = database.factions.find(a => a.name == factionName);
		var existingGoal = factionGoals.find(a => a.name == factionName);
		var cost = 10000 / (100 + faction.favor) * Math.max(0, augmentation.reputation -
			Math.max(ns.getFactionRep(factionName), existingGoal ? existingGoal.reputation : 0));
		if (!existingGoal) {
			if (faction.backdoor) {
				cost += 10000 / player.hacking_exp_mult * Math.max(0, ns.getServerRequiredHackingLevel(faction.backdoor) - player.hacking);
			}
			if (faction.hack) {
				cost += 10000 / player.hacking_exp_mult * Math.pow(Math.max(0, faction.hack - player.hacking, 2));
			}
			if (faction.company) {
				cost += 1e6 / (100 + faction.companyFavor) *
					Math.max(0, 200000 - ns.getCompanyRep(factionName)) / player.company_rep_mult;
			}
			if (faction.stats) {
				var statsNeed = Math.max(0, faction.stats - player.defense) / player.defense_exp_mult;
				statsNeed += Math.max(0, faction.stats - player.dexterity) / player.dexterity_exp_mult;
				statsNeed += Math.max(0, faction.stats - player.strength) / player.strength_exp_mult;
				statsNeed += Math.max(0, faction.stats - player.agility) / player.agility_exp_mult;
				cost += 10000 * statsNeed;
			}
			if (faction.money) {
				cost += Math.max(0, faction.money - ns.getServerMoneyAvailable("home"));
			}
		}
		if (cost < bestFactionCost) {
			bestFactionCost = cost;
			bestFaction = faction;
		}
	}
	var cost = bestFactionCost + 0.1 * augmentation.price;
	return { cost: bestFactionCost, faction: bestFaction };
}

/** @param {NS} ns **/
function getPossibleFactions(ns, database, factionGoals) {
	const locations = factionGoals.filter(a => (a.name == a.location)).map(a => a.name);
	locations.push(...ns.getPlayer().factions.filter(a => c.CITIES.includes(a)));
	// ns.printf("locations: %s", JSON.stringify(locations));
	const possibleFactions = database.factions.
		filter(a => c.STORY_LINE.some(b => b.name == a.name)).
		filter(a => (a.name != a.location) ||
			locations.every(b => isCompatible(b, a.location)));
	// ns.printf("Possible factions: %s", JSON.stringify(possibleFactions.map(a=>a.name)));
	return possibleFactions.filter(a => a.augmentations.length > 0);
}

/** @param {NS} ns **/
function findNextAugmentation(ns, database, factionGoals) {
	const augsToIgnore = getAugmentationsToPurchase(ns, database, factionGoals).map(a => a.name);
	// ns.tprintf("Augs to ignore: %s", JSON.stringify(augsToIgnore));
	const possibleFactions = getPossibleFactions(ns, database, factionGoals).map(a => a.name);
	const prios = ["Hacking", "Reputation", "Hacknet", "Company", "Combat", ""];
	var candidates = [];
	for (var prio of prios) {
		candidates = database.augmentations.filter(
			a => !augsToIgnore.includes(a.name) &&
				a.type == prio &&
				a.factions.some(b => possibleFactions.includes(b)));
		if (candidates.length) break;
	}
	for (var candidate of candidates) {
		candidate.factions = candidate.factions.filter(a => possibleFactions.includes(a));
	}
	if (!candidates.length) {
		return undefined;
	}
	candidates.sort((a, b) => (costToGet(ns, database, factionGoals, a).cost -
		costToGet(ns, database, factionGoals, b).cost));
	return { ...candidates[0], faction: costToGet(ns, database, factionGoals, candidates[0]).faction };
}

/** @param {NS} ns **/
function estimateDonations(ns, database, factionGoals) {
	var sum = 0;
	var donateFavor = ns.getFavorToDonate();
	var mult = ns.getPlayer().faction_rep_mult;
	for (var goal of factionGoals) {
		if (goal.reputation && ns.getFactionFavor(goal.name) > donateFavor) {
			sum += 1e6 * Math.max(0, goal.reputation - ns.getFactionRep(goal.name)) / mult;
		}
	}
	return sum;
}

function isCompatible(city1, city2) {
	if (city1 == "") return true;
	if (city2 == "") return true;
	if (city1 == city2) return true;
	if (city1 == c.VOLHAVEN || city2 == c.VOLHAVEN) return false;
	if (city1 == c.SECTOR12 && city2 != c.AEVUM) return false;
	if (city1 != c.AEVUM && city2 == c.SECTOR12) return false;
	if (city1 == c.AEVUM && city2 != c.SECTOR12) return false;
	if (city1 != c.SECTOR12 && city2 == c.AEVUM) return false;
	return true;
}