import { getAvailableMoney, runAndWait } from "helpers.js";
import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["reboot", false]]);
	var toPurchase = JSON.parse(options._[0]);
	var governor_faction = options._[1];
	var needReset = false;

	ns.tprintf("Augmentations to buy: %v", toPurchase);
	ns.tprintf("Faction to buy governors from: %s", governor_faction);

	for (var augmentation of toPurchase) {
		for (var faction of ns.getPlayer().factions) {
			if (ns.singularity.getAugmentationsFromFaction(faction).includes(augmentation)) {
				needReset = true;
				if (ns.singularity.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	ns.tprintf("Bought planned augmentations, spending remaining money: ", getAvailableMoney(ns, true));
	// if there is money left, run home upgrades
	await runAndWait(ns, "purchase-cores.js", "unlimited");
	await runAndWait(ns, "purchase-ram.js", "unlimited");

	// spend the rest of the money on Neural Governor augs
	while (getAvailableMoney(ns, true) > ns.singularity.getAugmentationPrice(GOVERNOR)) {
		if (ns.singularity.purchaseAugmentation(governor_faction, GOVERNOR)) {
			needReset = true;
			ns.tprintf("Bought governor, money left: %d", getAvailableMoney(ns, true));
			await ns.sleep(500);
		} else {
			break;
		}
	}

	if (options.reboot) {
		if (needReset) ns.spawn("reset.js");
		ns.spawn("nodestart.js");
	}
}