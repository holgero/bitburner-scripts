import { formatMoney } from "/helpers.js";
import * as c from "/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["dry-run", false]]);
	const database = JSON.parse(ns.read("database.txt"));
	const factionGoals = [];
	var augmentationCost = 0;
	while (Math.max(1e9, ns.getServerMoneyAvailable("home")) > augmentationCost) {
		var nextAug = findNextAugmentation(ns, database, factionGoals);
		ns.printf("Next Aug: %30s %10s %10d %s",
			nextAug.name, formatMoney(nextAug.price), nextAug.reputation, nextAug.faction.name);
		if (!nextAug) {
			break;
		}
		var existing = factionGoals.find(a => a.name == nextAug.faction.name);
		if (existing) {
			existing.reputation = Math.max(existing.reputation, nextAug.reputation);
		} else {
			factionGoals.push({ ...nextAug.faction, reputation: nextAug.reputation });
		}
		augmentationCost = estimatePrice(ns, database, factionGoals);
	}
	ns.printf("Goals: %s", JSON.stringify(factionGoals));
	ns.printf("Estimated Cost: %s", formatMoney(augmentationCost));
	do {
		var futureFactions = getPossibleFactions(ns, database, factionGoals).
			filter(a => !factionGoals.some(b => b.name == a.name));
		if (futureFactions.length) {
			factionGoals.push(futureFactions[0]);
		}
	} while (futureFactions.length);
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
			if (augmentation.reputation <= goal.reputation) {
				toPurchase.push(augmentation);
				ns.printf("Aug: %s", augName);
			}
		}
	}
	toPurchase.sort((a, b) => a.price - b.price).reverse();
	return toPurchase;
}

/** @param {NS} ns **/
function estimatePrice(ns, database, factionGoals) {
	const toPurchase = getAugmentationsToPurchase(ns, database, factionGoals);
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
function costToGet(ns, factions, augmentation) {
	const player = ns.getPlayer();
	var bestFactionCost = 1e9;
	var bestFaction = "";
	for (var factionName of augmentation.factions) {
		var faction = factions.find(a => a.name == factionName);
		var cost = Math.max(0, augmentation.reputation - ns.getFactionRep(factionName));
		if (!player.factions.includes(faction.name)) {
			if (faction.backdoor) {
				cost += 10000 / player.hacking_exp_mult * Math.max(0, ns.getServerRequiredHackingLevel(faction.backdoor) - player.hacking);
			}
			if (faction.hack) {
				cost += 10000 / player.hacking_exp_mult * Math.max(0, faction.hack - player.hacking);
			}
			if (faction.company) {
				cost += 1000 * Math.max(0, 200000 - ns.getCompanyRep(factionName)) / player.company_rep_mult;
			}
			if (faction.stats) {
				var statsNeed = (faction.stats - player.defense) / player.defense_exp_mult;
				statsNeed += (faction.stats - player.dexterity) / player.dexterity_exp_mult;
				statsNeed += (faction.stats - player.strength) / player.strength_exp_mult;
				statsNeed += (faction.stats - player.agility) / player.agility_exp_mult;
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
	const locations = factionGoals.filter(a => (a.name == a.location)).map(a=>a.name);
	locations.push(...ns.getPlayer().factions.filter(a=>c.CITIES.includes(a)));
	// ns.printf("locations: %s", JSON.stringify(locations));
	const possibleFactions = database.factions.
		filter(a => c.STORY_LINE.some(b => b.name == a.name)).
		filter(a => (a.name != a.location) ||
			locations.every(b => isCompatible(b, a.location)));
	// ns.printf("Possible factions: %s", JSON.stringify(possibleFactions.map(a=>a.name)));
	return possibleFactions;
}

/** @param {NS} ns **/
function findNextAugmentation(ns, database, factionGoals) {
	const augsToIgnore = getAugmentationsToPurchase(ns, database, factionGoals).map(a => a.name);
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
	if (!candidates.length) {
		return undefined;
	}
	for (var candidate of candidates) {
		candidate.factions = candidate.factions.filter(a => possibleFactions.includes(a));
	}
	candidates.sort((a, b) => (costToGet(ns, database.factions, a).cost - costToGet(ns, database.factions, b).cost));
	return { ...candidates[0], faction: costToGet(ns, database.factions, candidates[0]).faction };
}

/** @param {NS} ns **/
function estimateDonations(ns, database, factionGoals) {
	var sum = 0;
	var donateFavor = ns.getFavorToDonate();
	var mult = ns.getPlayer().faction_rep_mult;
	for (var goal of factionGoals) {
		if (ns.getFactionFavor(goal.name) > donateFavor) {
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