const GOVERNOR = "NeuroFlux Governor";

/** @param {NS} ns **/
export async function main(ns) {
	var toPurchase = [];
	var haveAug = ns.getOwnedAugmentations(true);
	for (var faction of ns.args) {
		// ns.tprintf("Augmentations of %s: %v", faction,
		//	ns.getAugmentationsFromFaction(faction));
		var reputation = ns.getFactionRep(faction);
		var possibleAugmentations = ns.getAugmentationsFromFaction(faction);
		for (var augmentation of possibleAugmentations) {
			if (ns.getAugmentationPrereq(augmentation).length > 0) {
				var haveThem = true;
				for (var requiredAug of ns.getAugmentationPrereq(augmentation)) {
					if (!haveAug.includes(requiredAug)) {
						haveThem = false;
						break;
					}
				}
				if (!haveThem) {
					continue;
				}
			}
			if (toPurchase.includes(augmentation)) {
				continue;
			}
			if (haveAug.includes(augmentation)) {
				continue;
			}
			var needed = ns.getAugmentationRepReq(augmentation);
			if (needed < reputation) {
				toPurchase.push(augmentation);
			}
		}
	}
	toPurchase.sort(function (a, b) { return ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b); });
	toPurchase.reverse();

	var governor_faction;
	var maxRep = 0;
	for (var faction of ns.args) {
		if (ns.getAugmentationsFromFaction(faction).includes(GOVERNOR)) {
			if (ns.getFactionRep(faction)>maxRep) {
				governor_faction = faction;
				maxRep = ns.getFactionRep(faction);
			}
		}
	}
	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(toPurchase));
	ns.spawn("purchase-augmentations.js", 1, JSON.stringify(ns.args), JSON.stringify(toPurchase), governor_faction);
}