import { getAugmentationsToPurchase, statsGainFactor, reputationNeeded } from "helpers.js";
import * as c from "constants.js";

const AUGS_PER_RUN = 7;
const COMPANY_REP_GAIN_THRESHOLD = 3.0;
const COMPANY_FACTION_MIN_REP = 5000;
const FACTION_STATS_THRESHOLD = 66;

/** @param {NS} ns **/
export async function main(ns) {
	var augsBeforeInstall = AUGS_PER_RUN;
	const database = JSON.parse(ns.read("faction-augmentations.txt"));
	const faction_augmentations = database.faction_augmentations;
	var faction_goals = [];

	calculateGoals(ns, faction_augmentations, augsBeforeInstall, faction_goals);
	var toPurchase = [];
	await getAugmentationsToPurchase(ns, faction_goals, database.owned_augmentations, toPurchase);
	await ns.write("nodestart.txt",
		JSON.stringify({
			factionGoals: faction_goals,
			estimatedPrice: estimatePrice(ns, toPurchase),
			estimatedDonations: estimateDonations(ns, faction_goals)
		}), "w");

	while (estimatePrice(ns, toPurchase) + estimateDonations(ns, faction_goals) <
		ns.getServerMoneyAvailable("home")) {
		await ns.write("nodestart.txt",
			JSON.stringify({
				factionGoals: faction_goals,
				estimatedPrice: estimatePrice(ns, toPurchase),
				estimatedDonations: estimateDonations(ns, faction_goals)
			}), "w");
		faction_goals = [];
		calculateGoals(ns, faction_augmentations, ++augsBeforeInstall, faction_goals);
		var newToPurchase = [];
		await getAugmentationsToPurchase(ns, faction_goals, database.owned_augmentations, newToPurchase);
		// ns.printf("%d", newToPurchase.length);
		if (newToPurchase.length < augsBeforeInstall) {
			break;
		}
		toPurchase = newToPurchase;
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

/** @param {NS} ns **/
function estimatePrice(ns, toPurchase) {
	var sum = 0;
	var factor = 1.0;
	for (var augmentation of toPurchase) {
		var toPay = factor * ns.getAugmentationPrice(augmentation);
		sum += toPay;
		factor = factor * 1.9;
	}
	return sum;
}

/** @param {NS} ns **/
function calculateGoals(ns, faction_augmentations, augsBeforeInstall, faction_goals) {
	var newAugs = calculateGoalsWithRep(ns, faction_augmentations,
		augsBeforeInstall, faction_goals, 1e9);
	// ns.printf("%s", JSON.stringify(faction_goals));
	ns.printf("New augmentations possible: %d", newAugs);
	while (newAugs >= augsBeforeInstall) {
		var neededRep = 0;
		for (var goal of faction_goals) {
			if (goal.reputation > neededRep) {
				neededRep = goal.reputation;
			}
		}
		neededRep--;
		var check_goals = [];
		newAugs = calculateGoalsWithRep(ns, faction_augmentations,
			augsBeforeInstall, check_goals, neededRep);
		ns.printf("augs with rep: (need %d) %d", augsBeforeInstall, newAugs);
		//if (augsBeforeInstall == 11 && newAugs == 10) {
		// ns.printf("%s", JSON.stringify(faction_goals));
		//}
		if (newAugs >= augsBeforeInstall) {
			faction_goals.splice(0, faction_goals.length);
			faction_goals.push(...check_goals);
		}
		// ns.printf("%s", JSON.stringify(faction_goals));
	}
}

/** @param {NS} ns **/
function calculateGoalsWithRep(ns, faction_augmentations, augsBeforeInstall, faction_goals, maxRep) {
	var newAugs = 0;
	var placeToBe = "";
	var player = ns.getPlayer();
	var companyWork = false;
	for (var faction of faction_augmentations) {
		if (newAugs >= augsBeforeInstall) {
			// enough augs for this run, add remaining factions with their
			// properties but a reputation goal of zero
			if (placeToBe && faction.location && faction.location == faction.name) {
				if (!isCompatible(placeToBe, faction.location)) continue;
			}
			faction_goals.push({ ...faction, reputation: 0 });
			continue;
		}
		// var augsToAdd = Math.min(augsPerFaction, augsBeforeInstall - newAugs);
		var augsToAdd = augsBeforeInstall - newAugs;
		var repToReach = faction.augmentations.length >= augsToAdd ?
			faction.augmentations[augsToAdd - 1].reputation :
			faction.augmentations[faction.augmentations.length - 1].reputation;
		ns.printf("Rep to reach with faction %s is %d", faction.name, repToReach);
		if (faction.company && ns.getFactionFavor(faction.name) == 0 && ns.getFactionRep(faction.name) == 0) {
			if (companyWork ||
				ns.getCompanyFavor(faction.name) == 0 ||
				player.company_rep_mult < COMPANY_REP_GAIN_THRESHOLD) {
				// skip for now, already have to work for another company or
				// no favor with the company or
				// too slow to gain any rep with companies
				continue;
			}
		}
		if (faction.stats && ns.getFactionFavor(faction.name) == 0) {
			if (faction.stats / statsGainFactor(ns) > FACTION_STATS_THRESHOLD) {
				continue;
			}
		}
		if (placeToBe && faction.location && faction.location == faction.name) {
			if (!isCompatible(placeToBe, faction.location)) continue;
		}
		if (!placeToBe && faction.location && faction.location == faction.name) {
			placeToBe = faction.location;
		}
		repToReach = Math.min(repToReach, maxRep);
		ns.printf("Rep to reach with faction %s is capped to %d", faction.name, repToReach);
		var repNeeded = 0;
		for (var augmentation of faction.augmentations) {
			if (augmentation.reputation <= repToReach) {
				repNeeded = augmentation.reputation;
			}
		}
		ns.printf("Rep needed with faction %s is %d", faction.name, repNeeded);
		if (player.hasCorporation && ns.getFactionFavor(faction.name) < ns.getFavorToDonate()) {
			// hopefully means plenty of money, we should be able to bribe some factions
			// during the next run
			if (reputationNeeded(ns, faction.name) < 0.5 * repNeeded) {
				repNeeded = reputationNeeded(ns, faction.name);
			}
		}
		for (var augmentation of faction.augmentations) {
			if (augmentation.reputation <= repNeeded) {
				newAugs++;
			}
		}
		if (faction.company && ns.getFactionFavor(faction.name) == 0 && ns.getFactionRep(faction.name) == 0) {
			// we still have to work for the company,
			// so work only a bit for the coresponding faction
			repNeeded = Math.min(repNeeded, COMPANY_FACTION_MIN_REP);
			companyWork = true;
		}
		faction_goals.push({ ...faction, reputation: repNeeded });
		ns.printf("Rep needed with faction %s is %d", faction.name, repNeeded);
	}
	return newAugs;
}

function isCompatible(city1, city2) {
	if (city1 == city2) return true;
	if (city1 == c.VOLHAVEN || city2 == c.VOLHAVEN) return false;
	if (city1 == c.SECTOR12 && city2 != c.AEVUM) return false;
	if (city1 == c.AEVUM && city2 != c.SECTOR12) return false;
	return true;
}