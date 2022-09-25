import { getAvailableMoney, reputationNeeded, getAugmentationsToPurchase } from "/helpers.js";
import * as c from "/constants.js";

const MIN_MONEY = 100e6;
const MAX_MONEY = 500e12;
const MAX_EFFORT = 1e15;
const MAX_AUGS = 12;

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["dry-run", false], ["money", 0]]);
	const database = JSON.parse(ns.read("database.txt"));
	const factionGoals = [];
	for (var factionName of ns.getPlayer().factions) {
		var faction = database.factions.find(a => a.name == factionName);
		if (!faction) {
			ns.tprintf("Unknown faction: %s", factionName);
			continue;
		}
		factionGoals.push({
			...faction,
			reputation: 0,
			aim: ""
		});
	}
	// ns.tprintf("Faction Goals start: %s", JSON.stringify(factionGoals));
	var maxMoneyToSpend = Math.max(MIN_MONEY, getAvailableMoney(ns, true));
	maxMoneyToSpend = Math.min(MAX_MONEY, maxMoneyToSpend);
	if (options.money) {
		maxMoneyToSpend = options.money;
	}
	var toPurchase = getAugmentationsToPurchase(ns, database, factionGoals, maxMoneyToSpend);
	var augmentationCost = estimatePrice(toPurchase);
	// ns.tprintf("Estimated cost at start: %s", formatMoney(augmentationCost));
	while (maxMoneyToSpend > augmentationCost) {
		var nextAug = findNextAugmentation(ns, database, factionGoals, maxMoneyToSpend);
		// ns.tprintf("Next Aug: %30s %10s %10d %s", nextAug.name, formatMoney(nextAug.price), nextAug.reputation, nextAug.faction.name);
		if (!nextAug || nextAug == undefined) {
			break;
		}
		// Check if existing goals have become obsolete.
		var additionalAugs = database.augmentations.
			filter(a => nextAug.faction.augmentations.includes(a.name)).
			filter(a => a.reputation <= nextAug.reputation);
		for (var addAug of additionalAugs) {
			for (var goal of factionGoals) {
				if (goal.name != nextAug.faction.name && goal.aim == addAug.name) {
					// ns.tprintf("Deleting: %s", JSON.stringify(goal));
					goal.aim = "";
					goal.reputation = 0;
				}
			}
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
		}
		toPurchase = getAugmentationsToPurchase(ns, database, factionGoals, maxMoneyToSpend);
		augmentationCost = estimatePrice(toPurchase);
		if (toPurchase.length > MAX_AUGS) {
			break;
		}
		// ns.tprintf("Estimated Cost: %s", formatMoney(augmentationCost));
		// ns.tprintf("Faction Goals: %s", JSON.stringify(factionGoals));
		// await ns.sleep(3000);
	}
	// ns.printf("Goals: %s", JSON.stringify(factionGoals));
	// ns.tprintf("Estimated cost with new goals: %s", formatMoney(augmentationCost));
	capGoalsAtFavorToDonate(ns, database, factionGoals);
	// no goals
	do {
		var futureFactions = getPossibleFactions(ns, database, factionGoals).
			filter(a => !factionGoals.some(b => b.name == a.name));
		var foundOne = false;
		for (var faction of futureFactions) {
			if (faction.augmentations.some(a => !toPurchase.some(b => b.name == a))) {
				factionGoals.push({ ...faction, reputation: 0, aim: "" });
				foundOne = true;
				break;
			}
		}
	} while (foundOne);
	toPurchase = getAugmentationsToPurchase(ns, database, factionGoals, maxMoneyToSpend);
	ns.printf("Augmentations to purchase: %s", JSON.stringify(toPurchase));
	augmentationCost = estimatePrice(toPurchase);
	var result = JSON.stringify({
		factionGoals: factionGoals,
		estimatedPrice: augmentationCost,
		estimatedDonations: estimateDonations(ns, database, factionGoals)
	});
	if (options["dry-run"]) {
		ns.run("print_goals.js", 1, "--direct", result);
	} else {
		await ns.write("factiongoals.txt", result, "w");
	}
}

/** @param {NS} ns **/
function capGoalsAtFavorToDonate(ns, database, factionGoals) {
	var limit = database.favorToDonate;
	for (var goal of factionGoals) {
		if (goal.favor < limit) {
			if (goal.reputation > 2 * reputationNeeded(ns, database, goal.name)) {
				goal.reputation = reputationNeeded(ns, database, goal.name);
			}
		}
	}
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
	var bestFactionCost = MAX_EFFORT;
	var bestFaction = "";
	for (var factionName of augmentation.factions) {
		var faction = database.factions.find(a => a.name == factionName);
		var existingGoal = factionGoals.find(a => a.name == factionName && a.reputation > 0);
		var cost = 100 / (100 + faction.favor) * Math.max(0, augmentation.reputation -
			Math.max(ns.singularity.getFactionRep(factionName), existingGoal ? existingGoal.reputation : 0));
		if (!existingGoal && !player.factions.includes(factionName)) {
			if (faction.backdoor) {
				cost += 1000 * reachHackingLevelCost(ns, database, player, ns.getServerRequiredHackingLevel(faction.backdoor));
				// ns.tprintf("Costs for %s from %s: %d / %d", augmentation.name, factionName, cost_old, cost_new);
			}
			if (faction.hack) {
				cost += 1000 * reachHackingLevelCost(ns, database, player, faction.hack);
			}
			if (faction.company) {
				cost += 20000 * (100 / (100 + faction.companyFavor)) *
					Math.max(0, 200000 - ns.singularity.getCompanyRep(factionName)) /
					player.mults.company_rep;
			}
			if (faction.stats) {
				var statsNeed = Math.max(0, faction.stats - player.defense) / player.mults.defense_exp;
				statsNeed += Math.max(0, faction.stats - player.dexterity) / player.mults.dexterity_exp;
				statsNeed += Math.max(0, faction.stats - player.strength) / player.mults.strength_exp;
				statsNeed += Math.max(0, faction.stats - player.agility) / player.mults.agility_exp;
				cost += 5000 * Math.pow(statsNeed, 3);
			}
			if (faction.money) {
				cost += 2 * Math.max(0, faction.money - getAvailableMoney(ns));
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

function reachHackingLevelCost(ns, database, player, level) {
	const delta = Math.max(0, level - Math.max(50, player.skills.hacking));
	var weighted = delta / player.mults.hacking_exp / player.mults.hacking;
	if (database.bitnodemultipliers) {
		weighted /= database.bitnodemultipliers.HackingLevelMultiplier;
		weighted /= database.bitnodemultipliers.HackExpGain;
	}
	return Math.pow(weighted, 4);
}

/** @param {NS} ns **/
function getPossibleFactions(ns, database, factionGoals) {
	const locations = factionGoals.filter(a => (a.name == a.location)).map(a => a.name);
	locations.push(...ns.getPlayer().factions.filter(a => c.CITIES.includes(a)));
	// ns.printf("locations: %s", JSON.stringify(locations));
	const possibleFactions = database.factions.
		filter(a => a.name != c.BLADEBURNERS).
		filter(a => c.STORY_LINE.some(b => b.name == a.name)).
		filter(a => (a.name != a.location) ||
			locations.every(b => isCompatible(b, a.location)));
	// ns.printf("Possible factions: %s", JSON.stringify(possibleFactions.map(a=>a.name)));
	return possibleFactions.filter(a => a.augmentations.length > 0);
}

/** @param {NS} ns **/
function findNextAugmentation(ns, database, factionGoals, maxPrice) {
	const augsToIgnore = getAugmentationsToPurchase(ns, database, factionGoals, maxPrice).map(a => a.name);
	// ns.tprintf("Augs to ignore: %s", JSON.stringify(augsToIgnore));
	const ownedAugs = [];
	ownedAugs.push(...database.owned_augmentations);
	ownedAugs.push(...augsToIgnore);
	const possibleFactions = getPossibleFactions(ns, database, factionGoals).map(a => a.name);
	// ns.printf("Possible factions: %s", possibleFactions);
	const prios = ["Hacking", "Reputation", "Hacknet", "Company", "Combat", "Crime", "Bladeburner", ""];
	if (database.bitnodemultipliers.HacknetNodeMoney <= 0) {
		// hacknet stuff is worthless, delete it from prios
		prios.splice(2, 1);
	}
	var player = ns.getPlayer();
	if (player.bitNodeN == 6 || player.bitNodeN == 7) {
		prios.unshift("Bladeburner", "Combat");
	}
	var candidates = [];
	for (var prio of prios) {
		candidates = database.augmentations.filter(
			a => !augsToIgnore.includes(a.name) &&
				a.requirements.every(a => ownedAugs.includes(a)) &&
				a.type == prio &&
				a.factions.some(b => possibleFactions.includes(b)) &&
				a.price < maxPrice);
		ns.printf("Candidates with prio %s: %s", prio, JSON.stringify(candidates.map(a => a.name)));
		for (var candidate of candidates) {
			candidate.factions = candidate.factions.filter(a => possibleFactions.includes(a));
		}
		if (!candidates.length) {
			continue;
		}
		candidates.forEach(a => {
			var cost = costToGet(ns, database, factionGoals, a);
			a.cost = cost.cost; a.faction = cost.faction
		});
		candidates = candidates.filter(a => a.faction != "");
		if (candidates.length) {
			break;
		}
	}
	candidates.sort((a, b) => a.cost - b.cost);
	ns.printf("Candidates: %s", JSON.stringify(candidates.map(a => {
		return { "name": a.name, "cost": a.cost }
	})));
	return candidates[0];
}

/** @param {NS} ns **/
function estimateDonations(ns, database, factionGoals) {
	var sum = 0;
	var donateFavor = database.favorToDonate;
	var mult = ns.getPlayer().mults.faction_rep;
	for (var goal of factionGoals) {
		if (goal.reputation && goal.favor > donateFavor) {
			sum += 1e6 * Math.max(0, goal.reputation - ns.singularity.getFactionRep(goal.name)) / mult;
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