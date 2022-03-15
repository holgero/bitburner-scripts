import { getAugmentationsToPurchase } from "helpers.js";
import { formatMoney } from "helpers.js";
import { GOVERNOR } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var toPurchase = [];
	var haveAug = ns.getOwnedAugmentations(true);
	var factions = [];
	var loopOver = ns.getPlayer().factions;
	if (ns.args.length > 0) {
		loopOver = ns.args;
	}
	for (var arg of loopOver) {
		if (arg.indexOf(":") > 0) {
			var idx = arg.indexOf(":");
			factions.push({name:arg.substring(0, idx), reputation:arg.substring(idx+1)});
		} else {
			factions.push({name:arg, reputation:ns.getFactionRep(arg)});
		}
	}
	ns.tprintf("Factions: %s", JSON.stringify(factions))
	await getAugmentationsToPurchase(ns, factions, toPurchase);
	ns.tprintf("Augmentations to buy: %v", toPurchase);
	var factor = 1.0;
	var sum = 0;
	ns.tprintf("%50s  %10s  %10s", "Augmentation", "Price", "Total");
	for (var augmentation of toPurchase) {
		var toPay = factor * ns.getAugmentationPrice(augmentation);
		sum += toPay;
		ns.tprintf("%50s: %10s  %10s", augmentation, formatMoney(toPay), formatMoney(sum));
		factor = factor * 1.9;
	}
}