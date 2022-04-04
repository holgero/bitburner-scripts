import { getAugmentationsToPurchase } from "helpers.js";
import * as c from "constants.js";

const STORY_LINE = [
	{ name: c.CYBERSEC, backdoor: "CSEC", money: 0, work: c.HACKING, location: "" },
	{ name: c.NETBURNERS, backdoor: "", money: 0, work: c.HACKING, location: "" },
	{ name: c.SECTOR12, backdoor: "", money: 15000000, work: c.HACKING, location: c.SECTOR12 },
	{ name: c.AEVUM, backdoor: "", money: 40000000, work: c.HACKING, location: c.AEVUM },
	{ name: c.TIAN_DI_HUI, backdoor: "", money: 1000000, work: c.HACKING, location: c.CHONGQING },
	{ name: c.NITESEC, backdoor: "avmnite-02h", work: c.HACKING, location: "" },
	{ name: c.SLUM_SNAKES, backdoor: "", money: 1000000, stats: 30, work: c.SECURITY_WORK, location: "" },
	{ name: c.CHONGQING, backdoor: "", money: 20000000, work: c.HACKING, location: c.CHONGQING },
	{ name: c.TETRADS, backdoor: "", money: 0, stats: 75, work: c.SECURITY_WORK, location: c.CHONGQING },
	{ name: c.NEW_TOKYO, backdoor: "", money: 20000000, work: c.HACKING, location: c.NEW_TOKYO },
	{ name: c.ISHIMA, backdoor: "", money: 30000000, work: c.HACKING, location: c.ISHIMA },
	{ name: c.VOLHAVEN, backdoor: "", money: 50000000, work: c.HACKING, location: c.VOLHAVEN },
	{ name: c.BLACK_HAND, backdoor: "I.I.I.I", work: c.HACKING, location: "" },
	{ name: c.BITRUNNERS, backdoor: "run4theh111z", work: c.HACKING, location: "" },
	{ name: c.SYNDICATE, backdoor: "", money: 10000000, stats: 200, work: c.HACKING, location: c.SECTOR12 },
	{ name: c.ECORP, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.NWO, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.SPEAKERS, backdoor: "", money: 0, stats: 300, work: c.HACKING, location: "" },
	{ name: c.DAEDALUS, backdoor: "", money: 100000000000, work: c.HACKING, location: "" }
];

const AUGS_PER_RUN = 7;

/** @param {NS} ns **/
export async function main(ns) {
	var augsBeforeInstall = AUGS_PER_RUN;
	const faction_augmentations = [];
	buildDatabase(ns, faction_augmentations, STORY_LINE);
	// ns.tprintf("Database of factions and augmentations: %s", JSON.stringify(faction_augmentations));
	removeDuplicateAugmentations(faction_augmentations);
	// ns.tprintf("Database of factions and augmentations: %s", JSON.stringify(faction_augmentations));

	var faction_goals = [];
	calculateGoals(ns, faction_augmentations, augsBeforeInstall, faction_goals);
	var toPurchase = [];
	await getAugmentationsToPurchase(ns, faction_goals, toPurchase);
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
		await getAugmentationsToPurchase(ns, faction_goals, newToPurchase);
		// ns.tprintf("%d", newToPurchase.length);
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
			sum += 1e6 * goal.reputation / mult;
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
	var newAugs = calculateGoalsWithRep(ns, faction_augmentations, augsBeforeInstall, faction_goals, 1e9);
	// ns.tprintf("%s", JSON.stringify(faction_goals));
	while (newAugs >= augsBeforeInstall) {
		var neededRep = 0;
		for (var goal of faction_goals) {
			if (goal.reputation > neededRep) {
				neededRep = goal.reputation;
			}
		}
		neededRep--;
		var check_goals = [];
		newAugs = calculateGoalsWithRep(ns, faction_augmentations, augsBeforeInstall, check_goals, neededRep);
		//ns.tprintf("augs with rep: (need %d) %d", augsBeforeInstall, newAugs);
		//if (augsBeforeInstall == 11 && newAugs == 10) {
			//ns.tprintf("%s", JSON.stringify(faction_goals));
		//}
		if (newAugs >= augsBeforeInstall) {
			faction_goals.splice(0, faction_goals.length);
			faction_goals.push(...check_goals);
		}
		// ns.tprintf("%s", JSON.stringify(faction_goals));
	}
}

/** @param {NS} ns **/
function calculateGoalsWithRep(ns, faction_augmentations, augsBeforeInstall, faction_goals, maxRep) {
	// const augsPerFaction = Math.floor(augsBeforeInstall / 3);
	var newAugs = 0;
	var placeToBe = "";
	var player = ns.getPlayer();
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
		if (faction.company && ns.getFactionFavor(faction.name) == 0) {
			// if we still need to work for the company first, just gain some favor
			repToReach = 25000;
		}
		if (player.hasCorporation && ns.getFactionFavor(faction.name) < ns.getFavorToDonate()) {
			// hopefully means plenty of money, we should be able to bribe some factions
			// during the next run
			repToReach = Math.min(repToReach, reputationNeeded(ns, faction.name));
		}
		if (placeToBe && faction.location && faction.location == faction.name) {
			if (!isCompatible(placeToBe, faction.location)) continue;
		}
		if (!placeToBe && faction.location && faction.location == faction.name) {
			placeToBe = faction.location;
		}
		repToReach = Math.min(repToReach, maxRep);
		if (faction.name == c.DAEDALUS) {
			if (ns.getFactionFavor(faction.name) < ns.getFavorToDonate()) {
				// try to get to favor for donating as soon as possible
				repToReach = Math.max(repToReach, reputationNeeded(ns, faction.name));
			} else {
				// reach the red pill
				repToReach = faction.augmentations[faction.augmentations.length - 1].reputation;
			}
		}
		var repNeeded = 0;
		for (var augmentation of faction.augmentations) {
			if (augmentation.reputation <= repToReach) {
				newAugs++;
				repNeeded = Math.max(repNeeded, augmentation.reputation);
			}
		}
		faction_goals.push({ ...faction, reputation: repNeeded });
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

/** @param {NS} ns **/
function buildDatabase(ns, faction_augmentations, factions) {
	var ignore = ns.getOwnedAugmentations(true);
	ignore.push(c.GOVERNOR);
	for (var faction of factions) {
		var augmentations = ns.getAugmentationsFromFaction(faction.name).
			filter(a => !ignore.includes(a)).
			map(a => ({
				augmentation: a,
				reputation: ns.getAugmentationRepReq(a),
				price: ns.getAugmentationPrice(a)
			}));
		if (augmentations.length > 0) {
			augmentations.sort((a, b) => a.reputation - b.reputation);
			faction_augmentations.push({ ...faction, augmentations: augmentations });
		}
	}
}

function removeDuplicateAugmentations(faction_augmentations) {
	// defer obtaining an augmentation from an early faction, iff it is at the end of their 
	// list of available augmentations (so that it costs extra reputation effort to obtain)
	for (var ii = 0; ii < faction_augmentations.length - 1; ii++) {
		var element = faction_augmentations[ii];
		do {
			if (element.augmentations.length > 0) {
				var lastAugmentation = element.augmentations[element.augmentations.length - 1];
				if (hasAugmentation(lastAugmentation.augmentation, faction_augmentations.slice(ii + 1))) {
					element.augmentations.pop();
					continue;
				}
			}
			break;
		} while (true);
	}
	removeFactionsWithoutAugmentations(faction_augmentations);
	var allAugmentations = [];
	for (var faction of faction_augmentations) {
		var filtered = faction.augmentations.filter(a => !allAugmentations.includes(a.augmentation));
		faction.augmentations = filtered;
		for (var augmentation of faction.augmentations) {
			allAugmentations.push(augmentation.augmentation);
		}
	}
	removeFactionsWithoutAugmentations(faction_augmentations);
}

function hasAugmentation(augmentation, faction_augmentations) {
	for (var faction of faction_augmentations) {
		if (faction.augmentations.some(a => a.augmentation == augmentation)) {
			return true;
		}
	}
	return false;
}

function removeFactionsWithoutAugmentations(faction_augmentations) {
	for (var ii = 0; ii < faction_augmentations.length; ii++) {
		var element = faction_augmentations[ii];
		if (element.augmentations.length == 0) {
			faction_augmentations.splice(ii, 1);
			ii--;
		}
	}
}

/** @param {NS} ns **/
function reputationNeeded(ns, faction) {
	var previousReputation = Math.pow(1.02, ns.getFactionFavor(faction) - 1) * 25500 - 25000;
	var reputationNeeded = Math.pow(1.02, ns.getFavorToDonate() - 1) * 25500 - 25000;
	return Math.max(0, reputationNeeded - previousReputation);
}