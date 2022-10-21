import {
	getDatabase,
	getAvailableMoney,
	reputationNeeded,
	getAugmentationsToPurchase,
	getAugmentationPrios
} from "/helpers.js";
import { effortForSkillLevel } from "./skill-helper.js";
import * as c from "/constants.js";

const MAX_EFFORT = 10e15;

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["dry-run", false], ["money", 1e15]]);
	const database = getDatabase(ns);
	const factionGoals = [];
	for (var factionName of ns.getPlayer().factions) {
		var faction = database.factions.find(a => a.name == factionName);
		if (!faction) {
			ns.tprintf("Unknown faction: %s", factionName);
			continue;
		}
		if (!faction.gang) {
			factionGoals.push({
				...faction,
				reputation: 0,
				aim: ""
			});
		}
	}
	// ns.tprintf("Faction Goals start: %s", JSON.stringify(factionGoals));
	const maxPrice = options.money;
	var toPurchase = getAugmentationsToPurchase(ns, database, factionGoals, maxPrice);
	for (var ii = 0; ii < 3; ii++) {
		var nextAug = findNextAugmentation(ns, database, factionGoals, maxPrice);
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
		toPurchase = getAugmentationsToPurchase(ns, database, factionGoals, maxPrice);
		// ns.tprintf("Faction Goals: %s", JSON.stringify(factionGoals));
		// await ns.sleep(3000);
	}
	// ns.printf("Goals: %s", JSON.stringify(factionGoals));
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
	toPurchase = getAugmentationsToPurchase(ns, database, factionGoals, maxPrice);
	ns.printf("Augmentations to purchase: %s", JSON.stringify(toPurchase));
	var result = JSON.stringify({
		factionGoals: factionGoals,
		estimatedPrice: estimatePrice(toPurchase),
		estimatedDonations: estimateDonations(ns, database, factionGoals)
	});
	if (options["dry-run"]) {
		ns.run("print_goals.js", 1, "--direct", result);
	} else {
		ns.write("factiongoals.txt", result, "w");
	}
}

/** @param {NS} ns **/
function capGoalsAtFavorToDonate(ns, database, factionGoals) {
	var limit = database.favorToDonate;
	for (var goal of factionGoals) {
		if (goal.favor < limit) {
			if (goal.reputation > 2 * reputationNeeded(ns, database, goal.name) &&
				ns.singularity.getFactionRep(goal.name) < reputationNeeded(ns, database, goal.name)) {
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
				cost += 1000 * effortForSkillLevel(ns, database, "hacking", ns.getServerRequiredHackingLevel(faction.backdoor));
			}
			if (faction.hack) {
				cost += 1000 * effortForSkillLevel(ns, database, "hacking", faction.hack);
			}
			if (faction.company) {
				cost += 1000 * (100 / (100 + faction.companyFavor)) *
					Math.max(0, 400000 - ns.singularity.getCompanyRep(factionName)) /
					player.mults.company_rep;
			}
			if (faction.stats) {
				cost += 1000 * effortForSkillLevel(ns, database, "strength", faction.stats);
				cost += 1000 * effortForSkillLevel(ns, database, "defense", faction.stats);
				cost += 1000 * effortForSkillLevel(ns, database, "dexterity", faction.stats);
				cost += 1000 * effortForSkillLevel(ns, database, "agility", faction.stats);
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

/** @param {NS} ns **/
function getPossibleFactions(ns, database, factionGoals) {
	const locations = factionGoals.filter(a => (a.name == a.location)).map(a => a.name);
	locations.push(...ns.getPlayer().factions.filter(a => c.CITIES.includes(a)));
	// ns.printf("locations: %s", JSON.stringify(locations));
	const nAugs = database.owned_augmentations.length;
	const nKills = ns.getPlayer().numPeopleKilled;
	const possibleFactions = database.factions.
		filter(a => !a.gang).
		filter(a => !a.special).
		filter(a => c.STORY_LINE.some(b => b.name == a.name)).
		filter(a => !a.augsNeeded || a.augsNeeded <= nAugs).
		filter(a => !a.kills || a.kills <= nKills).
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
	const prios = getAugmentationPrios(ns);
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