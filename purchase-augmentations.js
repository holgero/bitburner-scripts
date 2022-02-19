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
	ns.tprintf("Augmentations to buy: %v", toPurchase);
	for (var augmentation of toPurchase) {
		while (ns.getServerMoneyAvailable("home") < ns.getAugmentationPrice(augmentation)) {
			ns.tprintf("Can't afford %s yet, waiting...", augmentation);
			await ns.sleep(60000);
		}
		for (var faction of ns.args) {
			if (ns.getAugmentationsFromFaction(faction).includes(augmentation)) {
				if (ns.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	var GOVENOR = "NeuroFlux Governor";
	var govenor_faction;
	for (var faction of ns.args) {
		if (ns.getAugmentationsFromFaction(faction).includes(GOVENOR)) {
			govenor_faction = faction;
			break;
		}
	}
	// spend the rest of the money on Neural Govenor augs
	while (ns.getServerMoneyAvailable("home") > ns.getAugmentationPrice(GOVENOR)) {
		ns.purchaseAugmentation(govenor_faction, GOVENOR);
	}

	await incrementCounter(ns);
	ns.spawn("reset.js");
}

/** @param {NS} ns **/
async function incrementCounter(ns) {
	var bootcount = ns.read("count.txt");
	bootcount++;
	await ns.write("count.txt", bootcount, "w");

	return bootcount;
}