import * as c from "constants.js";

const STORY_LINE = [
	{ name: c.CYBERSEC, backdoor: "CSEC", money: 0, work: c.HACKING, location: "" },
	{ name: c.NETBURNERS, backdoor: "", money: 0, work: c.HACKING, location: "" },
	{ name: c.SECTOR12, backdoor: "", money: 15000000, work: c.HACKING, location: c.SECTOR12 },
	{ name: c.SLUM_SNAKES, backdoor: "", money: 1000000, stats: 30, work: c.SECURITY_WORK, location: "" },
	{ name: c.AEVUM, backdoor: "", money: 40000000, work: c.HACKING, location: c.AEVUM },
	{ name: c.TIAN_DI_HUI, backdoor: "", money: 1000000, work: c.HACKING, location: c.CHONGQING },
	{ name: c.CHONGQING, backdoor: "", money: 20000000, work: c.HACKING, location: c.CHONGQING },
	{ name: c.TETRADS, backdoor: "", money: 0, stats: 75, work: c.SECURITY_WORK, location: c.CHONGQING },
	{ name: c.NEW_TOKYO, backdoor: "", money: 20000000, work: c.HACKING, location: c.NEW_TOKYO },
	{ name: c.ISHIMA, backdoor: "", money: 30000000, work: c.HACKING, location: c.ISHIMA },
	{ name: c.VOLHAVEN, backdoor: "", money: 50000000, work: c.HACKING, location: c.VOLHAVEN },
	{ name: c.NITESEC, backdoor: "avmnite-02h", work: c.HACKING, location: "" },
	{ name: c.BLACK_HAND, backdoor: "I.I.I.I", work: c.HACKING, location: "" },
	{ name: c.BITRUNNERS, backdoor: "run4theh111z", work: c.HACKING, location: "" },
	{ name: c.SPEAKERS, backdoor: "", money: 0, stats: 300, work: c.HACKING, location: "" },
	{ name: c.ECORP, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.SYNDICATE, backdoor: "", money: 10000000, stats: 300, work: c.HACKING, location: c.SECTOR12 },
	{ name: c.NWO, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.DAEDALUS, backdoor: "", money: 100000000000, work: c.HACKING, location: "" }
];

/** @param {NS} ns **/
export async function main(ns) {
	const augsBeforeInstall = +ns.args[0];
	const augsPerFaction = +ns.args[1];
	const faction_augmentations = [];
	buildDatabase(ns, faction_augmentations, STORY_LINE);
	// ns.tprintf("Database of factions and augmentations: %s", JSON.stringify(faction_augmentations));
	removeDuplicateAugmentations(faction_augmentations);
	// ns.tprintf("Database of factions and augmentations: %s", JSON.stringify(faction_augmentations));

	var faction_goals = [];
	var newAugs = 0;
	var placeToBe = "";
	var player = ns.getPlayer();
	for (var faction of faction_augmentations) {
		if (newAugs >= augsBeforeInstall) {
			// enough augs for this run, add remaining factions with their
			// properties but a reputation goal of 0
			if (placeToBe && faction.location && faction.location == faction.name) {
				if (!isCompatible(placeToBe, faction.location)) continue;
			}
			faction_goals.push({ ...faction, reputation: 0 });
			continue;
		}
		var augsToAdd = Math.min(augsPerFaction, augsBeforeInstall - newAugs);
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
		if (faction.name == c.DAEDALUS) {
			if (ns.getFactionFavor(faction.name) < ns.getFavorToDonate()) {
				// try to get to favor 150 as soon as possible
				repToReach = Math.max(repToReach, reputationNeeded(ns, faction.name));
			} else {
				// reach the red pill
				repToReach = faction.augmentations[faction.augmentations.length - 1].reputation;
			}
		}
		for (var augmentation of faction.augmentations) {
			if (augmentation.reputation <= repToReach) {
				newAugs++;
			}
		}
		faction_goals.push({ ...faction, reputation: repToReach });
	}
	// ns.tprintf("Faction goals: %s", JSON.stringify(faction_goals));
	await ns.write("nodestart.txt", JSON.stringify({ factionGoals: faction_goals }), "w");
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
	for (var faction of factions) {
		var augmentations = ns.getAugmentationsFromFaction(faction.name).
			filter(a => !ignore.includes(a)).
			map(a => ({ augmentation: a, reputation: ns.getAugmentationRepReq(a) }));
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