import { getAvailableMoney, runAndWait } from "helpers.js";
import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["reboot", false]]);
	var toPurchase = JSON.parse(options._[0]);
	var needReset = false;

	ns.tprintf("Augmentations to buy: %v", toPurchase);

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
	await runAndWait(ns, "governors.js");
	await runAndWait(ns, "purchase-sleeve-augs.js");
	
	if (options.reboot) {
		if (needReset) ns.spawn("reset.js");
		ns.spawn("nodestart.js");
	}
}