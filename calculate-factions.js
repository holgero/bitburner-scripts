import * as c from "constants.js";

const STORY_LINE = [
	c.CYBERSEC,
	c.NETBURNERS,
	c.SECTOR12,
	c.NITESEC,
	c.BLACK_HAND,
	c.CHONGQING,
	c.TIAN_DI_HUI,
	c.BITRUNNERS,
	c.DAEDALUS].reverse();
// const CITIES = [c.SECTOR12, c.AEVUM, c.ISHIMA, c.CHONGQING, c.NEW_TOKYO, c.VOLHAVEN];

const AUGS_BEFORE_INSTALL = 7;
const AUGS_PER_FACTION = 2;

/** @param {NS} ns **/
export async function main(ns) {
	var factionsToJoin = [];
	var augmentations = new Set();
	for (var augmentation of ns.getOwnedAugmentations(true)) {
		augmentations.add(augmentation);
	}
	for (var faction of STORY_LINE) {
		if (hasNewAugmentation(ns, faction, augmentations)) {
			factionsToJoin.push(faction);
		}
	}
	factionsToJoin.reverse();
	ns.tprintf("Factions to join: %s", JSON.stringify(factionsToJoin));
	var ownedAugmentations = ns.getOwnedAugmentations(true);
	var newAugs = 0;
	var factionReps = [];
	for (var faction of factionsToJoin) {
		var augmentations = ns.getAugmentationsFromFaction(faction).filter(
			(a) => !ownedAugmentations.includes(a));
		ns.tprintf("Augmentations owned: %s", JSON.stringify(ownedAugmentations));
		ns.tprintf("Factions from %s: %s", faction, JSON.stringify(augmentations));
		augmentations.sort((a, b) => ns.getAugmentationRepReq(a) - ns.getAugmentationRepReq(b));
		var repToReach = augmentations.length > AUGS_PER_FACTION ?
			ns.getAugmentationRepReq(augmentations[AUGS_PER_FACTION]) :
			ns.getAugmentationRepReq(augmentations.pop());
		for (var augmentation of augmentations) {
			if (ns.getAugmentationRepReq(augmentation) <= repToReach) {
				newAugs++;
				ownedAugmentations.push(augmentation);
			}
			if (newAugs >= AUGS_BEFORE_INSTALL) {
				repToReach = ns.getAugmentationRepReq(augmentation);
				break;
			}
		}
		if (ns.getFactionRep(faction) < repToReach) {
			factionReps.push({ name: faction, reputation: repToReach });
		}
		if (newAugs >= AUGS_BEFORE_INSTALL) {
			break;
		}
	}
	ns.tprintf("Faction goals: %s", JSON.stringify(factionReps));
	await ns.write("nodestart.txt", JSON.stringify({ toJoin: factionsToJoin, factionGoals: factionReps }), "w");
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