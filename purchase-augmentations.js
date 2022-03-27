import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["reboot", false]]);
	var toPurchase = JSON.parse(options._[0]);
	var governor_faction = options._[1];

	ns.tprintf("Augmentations to buy: %v", toPurchase);
	ns.tprintf("Faction to buy governors from: %s", governor_faction);

	for (var augmentation of toPurchase) {
		while (ns.getServerMoneyAvailable("home") < ns.getAugmentationPrice(augmentation)) {
			ns.tprintf("Can't afford %s yet, waiting...", augmentation);
			if (!ns.isBusy()) ns.run("commit-crimes.js", 1);
			await ns.sleep(60000);
		}
		for (var faction of ns.getPlayer().factions) {
			if (ns.getAugmentationsFromFaction(faction).includes(augmentation)) {
				if (ns.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	ns.tprintf("Bought planned augmentations, spending remaining money: ", ns.getServerMoneyAvailable("home"));
	if (ns.getPlayer().hasCorporation) {
		ns.tprintf("Checking if we can spend money on IPO of our corporation");
		ns.run("corporation.js", 1, "--public", Math.floor(0.9 * ns.getServerMoneyAvailable("home")));
		while (ns.scriptRunning("corporation.js", "home") ||
			ns.scriptRunning("corporation2.js", "home") ||
			(ns.serverExists("pserv-0") && ns.scriptRunning("corporation2.js", "home"))) {
			await ns.sleep(5000);
		}
	}
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

	if (options.reboot) {
		ns.spawn("reset.js");
	}
}