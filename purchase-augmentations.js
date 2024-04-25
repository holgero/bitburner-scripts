import { getAvailableMoney, runAndWait } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["reboot", false]]);
	var toPurchase = JSON.parse(options._[0]);

	ns.tprintf("Augmentations to buy: %v", toPurchase);

	for (var augmentation of toPurchase) {
		for (var faction of ns.getPlayer().factions) {
			if (ns.singularity.getAugmentationsFromFaction(faction).includes(augmentation)) {
				if (ns.singularity.purchaseAugmentation(faction, augmentation)) break;
			}
		}
	}

	ns.tprintf("Bought planned augmentations, spending remaining money: ", getAvailableMoney(ns, true));
	await runAndWait(ns, "joinfactions.js", "--all");
	await runAndWait(ns, "governors.js");
	// if there is money left, run home upgrades
	await runAndWait(ns, "purchase-cores.js", "--unlimited");
	await runAndWait(ns, "purchase-ram.js", "--unlimited");
	await runAndWait(ns, "purchase-stock-api.js", "--all");
	await runAndWait(ns, "gangs.js", "--spend");
	await runAndWait(ns, "purchase-sleeve-augs.js");
	
	if (options.reboot) {
		ns.spawn("reset.js");
	}
}