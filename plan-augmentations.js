import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["run_purchase", false]]);
	var factions = ns.getPlayer().factions;
	var toPurchase = [];
	await getAugmentationsToPurchase(ns, factions, toPurchase);

	var governor_faction;
	var maxRep = 0;
	for (var faction of factions) {
		if (ns.getAugmentationsFromFaction(faction).includes(GOVERNOR)) {
			if (ns.getFactionRep(faction) > maxRep) {
				governor_faction = faction;
				maxRep = ns.getFactionRep(faction);
			}
		}
	}
	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(toPurchase));
	if (options.run_purchase) {
		ns.spawn("purchase-augmentations.js", 1, JSON.stringify(factions),
			JSON.stringify(toPurchase), governor_faction);
	}
}

/** @param {NS} ns **/
async function getAugmentationsToPurchase(ns, factions, toPurchase) {
	var haveAug = ns.getOwnedAugmentations(true);
	if (!haveAug.includes(GOVERNOR)) {
		haveAug.push(GOVERNOR);
	}
	var augmentations = [];
	await addPossibleAugmentations(ns, factions, augmentations, haveAug);
	await addPossibleAugmentations(ns, factions, augmentations, haveAug);

	augmentations.sort(function (a, b) { return a.sortc - b.sortc; });
	augmentations.reverse();
	for (var augmentation of augmentations) {
		toPurchase.push(augmentation.name);
	}
}

/** @param {NS} ns **/
async function addPossibleAugmentations(ns, factions, toPurchase, haveAug) {
	for (var faction of factions) {
		var reputation = ns.getFactionRep(faction);
		var possibleAugmentations = ns.getAugmentationsFromFaction(faction);
		for (var augmentation of possibleAugmentations) {
			if (haveAug.includes(augmentation)) {
				continue;
			}
			if (toPurchase.some(a => a.name == augmentation)) {
				continue;
			}
			var needed = ns.getAugmentationRepReq(augmentation);
			if (needed > reputation) {
				continue;
			}
			var sortc = ns.getAugmentationPrice(augmentation);
			var requiredAugs = ns.getAugmentationPrereq(augmentation);
			if (requiredAugs.length > 0) {
				var haveThem = true;
				for (var requiredAug of requiredAugs) {
					if (!haveAug.includes(requiredAug)) {
						haveThem = false;
						break;
					}
				}
				if (!haveThem) {
					if (requiredAugs.length == 1) {
						var requiredAug = requiredAugs[0];
						var reqIdx = toPurchase.findIndex(a => a.name == requiredAug);
						if (reqIdx < 0) {
							continue;
						}
						sortc = (toPurchase[reqIdx].sortc + 1.9 * sortc) / 2.9;
						toPurchase[reqIdx].sortc = sortc + 1;
					}
				}
			}
			toPurchase.push({ name: augmentation, sortc: sortc });
		}
		await ns.sleep(100);
	}
	// ns.tprintf("Augs: %s", JSON.stringify(toPurchase))
}