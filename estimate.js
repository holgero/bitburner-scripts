import { formatMoney } from "helpers.js";

const GOVERNOR = "NeuroFlux Governor";

/** @param {NS} ns **/
export async function main(ns) {
	var toPurchase = [];
	var haveAug = ns.getOwnedAugmentations(true);
	var factions = [];
	for (var arg of ns.args) {
		if (arg.indexOf(":") > 0) {
			var idx = arg.indexOf(":");
			factions.push({name:arg.substring(0, idx), reputation:arg.substring(idx+1)});
		} else {
			factions.push({name:arg, reputation:ns.getFactionRep(arg)});
		}
	}
	for (var faction of factions) {
		var possibleAugmentations = ns.getAugmentationsFromFaction(faction.name);
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
			if (augmentation == GOVERNOR) continue;
			if (toPurchase.includes(augmentation)) continue;
			if (haveAug.includes(augmentation)) continue;
			var needed = ns.getAugmentationRepReq(augmentation);
			if (needed <= faction.reputation) {
				toPurchase.push(augmentation);
			}
		}
	}
	toPurchase.sort(function (a, b) { return ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b); });
	toPurchase.reverse();
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