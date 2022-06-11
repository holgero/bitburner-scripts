import { getAvailableMoney } from "helpers.js";
import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["reboot", false]]);
	var toPurchase = JSON.parse(options._[0]);
	var governor_faction = options._[1];

	ns.tprintf("Augmentations to buy: %v", toPurchase);
	ns.tprintf("Faction to buy governors from: %s", governor_faction);

	for (var augmentation of toPurchase) {
		for (var faction of ns.getPlayer().factions) {
			if (ns.getAugmentationsFromFaction(faction).includes(augmentation)) {
				if (ns.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	ns.tprintf("Bought planned augmentations, spending remaining money: ", getAvailableMoney(ns, true));
	// if there is money left, run home upgrades
	while (ns.getUpgradeHomeCoresCost() < getAvailableMoney(ns, true)) {
		if (!ns.upgradeHomeCores()) break;
		ns.tprintf("Bought a core, money left: %d", ns.getAvailableMoney(ns, true));
		await ns.sleep(500);
	}
	while (ns.getUpgradeHomeRamCost() < ns.getAvailableMoney(ns, true)) {
		if (!ns.upgradeHomeRam()) break;
		ns.tprintf("Bought ram, money left: %d", ns.getAvailableMoney(ns, true));
		await ns.sleep(500);
	}

	// spend the rest of the money on Neural Governor augs
	while (ns.getAvailableMoney(ns, true) > ns.getAugmentationPrice(GOVERNOR)) {
		if (ns.purchaseAugmentation(governor_faction, GOVERNOR)) {
			ns.tprintf("Bought governor, money left: %d", ns.getAvailableMoney(ns, true));
			await ns.sleep(500);
		} else {
			break;
		}
	}

	if (options.reboot) {
		ns.spawn("reset.js");
	}
}