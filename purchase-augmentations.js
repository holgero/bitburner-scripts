import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var factions = JSON.parse(ns.args[0]);
	var toPurchase = JSON.parse(ns.args[1]);
	var governor_faction = ns.args[2];
	var reboot = (ns.length == 4 && ns.args[3] == "--reboot");

	ns.tprintf("Factions to buy from: %s", factions);
	ns.tprintf("Augmentations to buy: %v", toPurchase);
	ns.tprintf("Faction to buy governors from: %s", governor_faction);

	for (var augmentation of toPurchase) {
		while (ns.getServerMoneyAvailable("home") < ns.getAugmentationPrice(augmentation)) {
			ns.tprintf("Can't afford %s yet, waiting...", augmentation);
			if (!ns.isBusy()) ns.run("commit-crimes.js", 1);
			await ns.sleep(60000);
		}
		for (var faction of factions) {
			if (ns.getAugmentationsFromFaction(faction).includes(augmentation)) {
				if (ns.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	ns.tprintf("Bought planned augmentations, spending remaining money: ", ns.getServerMoneyAvailable("home"));
	// if there is money left, run home upgrades
	while (ns.getUpgradeHomeCoresCost() < ns.getServerMoneyAvailable("home")) {
		if (!ns.upgradeHomeCores()) break;
		ns.tprintf("Bought a core, money left: %d", ns.getServerMoneyAvailable("home"));
		await ns.sleep(500);
	}
	while (ns.getUpgradeHomeRamCost() < ns.getServerMoneyAvailable("home")) {
		if (!ns.upgradeHomeRam()) break;
		ns.tprintf("Bought ram, money left: %d", ns.getServerMoneyAvailable("home"));
		await ns.sleep(500);
	}

	// spend the rest of the money on Neural Governor augs
	while (ns.getServerMoneyAvailable("home") > ns.getAugmentationPrice(GOVERNOR)) {
		ns.purchaseAugmentation(governor_faction, GOVERNOR);
		ns.tprintf("Bought governor, money left: %d", ns.getServerMoneyAvailable("home"));
		await ns.sleep(500);
	}

	await incrementCounter(ns);
	if (reboot) {
		ns.spawn("reset.js");
	}
}

/** @param {NS} ns **/
async function incrementCounter(ns) {
	var bootcount = ns.read("count.txt");
	bootcount++;
	await ns.write("count.txt", bootcount, "w");

	return bootcount;
}