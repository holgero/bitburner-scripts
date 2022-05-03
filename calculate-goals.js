import { getAugmentationsToPurchase, statsGainFactor, reputationNeeded } from "/helpers.js";
import * as db from "/database.js";
import * as c from "/constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	var augmentationCost = 0;
	var factionAugmentations = [];
	while (ns.getServerMoneyAvailable("home") > augmentationCost) {
		var nextAug = findNextAugmentation(ns, database.factions, database.augmentations);
	}
}

/** @param {NS} ns **/
function findNextAugmentation(ns, factions, augmentations) {
	const prios = ["Hacking", "Reputation", "Hacknet", "Company", "Combat", ""];
	var candidates = [];
	for (var prio of prios) {
		candidates = augmentations.filter(a => a.type == prio);
		if (candidates.length) break;
	}
}




/** @param {NS} ns **/
function estimateDonations(ns, faction_goals) {
	var sum = 0;
	var mult = ns.getPlayer().faction_rep_mult;
	for (var goal of faction_goals) {
		if (ns.getFactionFavor(goal.name) > ns.getFavorToDonate()) {
			sum += 1e6 * Math.max(0, goal.reputation - ns.getFactionRep(goal.name)) / mult;
		}
	}
	return sum;
}

function isCompatible(city1, city2) {
	if (city1 == city2) return true;
	if (city1 == c.VOLHAVEN || city2 == c.VOLHAVEN) return false;
	if (city1 == c.SECTOR12 && city2 != c.AEVUM) return false;
	if (city1 != c.AEVUM && city2 == c.SECTOR12) return false;
	if (city1 == c.AEVUM && city2 != c.SECTOR12) return false;
	if (city1 != c.SECTOR12 && city2 == c.AEVUM) return false;
	return true;
}