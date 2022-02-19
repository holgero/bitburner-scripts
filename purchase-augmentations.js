const GOVERNOR = "NeuroFlux Governor";

/** @param {NS} ns **/
export async function main(ns) {
	var factions = JSON.parse(ns.args[0]);
	var toPurchase = JSON.parse(ns.args[1]);
	var governor_faction = ns.args[2];
	
	ns.tprintf("Factions to buy from: %s", factions);
	ns.tprintf("Augmentations to buy: %v", toPurchase);
	ns.tprintf("Faction to buy governors from: %s", governor_faction);

	for (var augmentation of toPurchase) {
		while (ns.getServerMoneyAvailable("home") < ns.getAugmentationPrice(augmentation)) {
			ns.tprintf("Can't afford %s yet, waiting...", augmentation);
			await ns.sleep(60000);
		}
		for (var faction of factions) {
			if (ns.getAugmentationsFromFaction(faction).includes(augmentation)) {
				if (ns.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	// if there is money left, run home upgrades
	while (ns.getUpgradeHomeCoresCost() < ns.getServerMoneyAvailable("home")) {
		ns.upgradeHomeCores();
	}
	while (ns.getUpgradeHomeRamCost() < ns.getServerMoneyAvailable("home")) {
		ns.upgradeHomeRam();
	}

	// spend the rest of the money on Neural Governor augs
	while (ns.getServerMoneyAvailable("home") > ns.getAugmentationPrice(GOVERNOR)) {
		ns.purchaseAugmentation(governor_faction, GOVERNOR);
	}

	await incrementCounter(ns);
	// ns.spawn("reset.js");
}

/** @param {NS} ns **/
async function incrementCounter(ns) {
	var bootcount = ns.read("count.txt");
	bootcount++;
	await ns.write("count.txt", bootcount, "w");

	return bootcount;
}