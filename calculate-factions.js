import * as c from "constants.js";
const STORY_LINE = [c.CYBERSEC, c.NITESEC, c.BLACK_HAND, c.BITRUNNERS, c.DAEDALUS].reverse();
const CITIES = [c.SECTOR12, c.AEVUM, c.ISHIMA, c.CHONGQING, c.NEW_TOKYO, c.VOLHAVEN];

/** @param {NS} ns **/
export async function main(ns) {
	var factionsToJoin = [];
	var augmentations = new Set();
	for (var augmentation of ns.getOwnedAugmentations()) {
		augmentations.add(augmentation);
	}
	for (var faction of STORY_LINE) {
		if (hasNewAugmentation(ns, faction, augmentations)) {
			factionsToJoin.push(faction);
		}
	}
	factionsToJoin.reverse();
	var factionWork = [];
	var augmentationCount = 0;
	var factionIdx = 0;
	augmentations.clear();
	for (var augmentation of ns.getOwnedAugmentations()) {
		augmentations.add(augmentation);
	}
	while (augmentationCount < 8) {
		var faction = factionsToJoin[factionIdx];
		for (var augmentation of ns.getAugmentationsFromFaction(faction)) {
			if (!augmentations.has(augmentation)) {
				break;
			} else {
				break;
			}
		}
	}
	ns.tprintf("Factions to join: %s", JSON.stringify(factionsToJoin));
}

/** @param {NS} ns **/
function hasNewAugmentation(ns, faction, augmentations) {
	var hasNew = false;
	for (var augmentation of ns.getAugmentationsFromFaction(faction)) {
		if (!augmentations.has(augmentation)) {
			hasNew = true;
			augmentations.add(augmentation);
		}
	}
	return hasNew;
}