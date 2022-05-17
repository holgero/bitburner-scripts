import { getAugmentationsToPurchase } from "helpers.js";
import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["goal", false], ["write", false]]);
	var factions = [];
	var loopOver = ns.getPlayer().factions;
	if (options._.length > 0) {
		loopOver = options._;
	} else {
		if (options.goal) {
			const config = JSON.parse(ns.read("factiongoals.txt"));
			loopOver = [];
			for (var goal of config.factionGoals) {
				if (goal.reputation) {
					loopOver.push(goal.name + ":" + goal.reputation);
				} else {
					loopOver.push(goal.name);
				}
			}
		}
	}
	for (var arg of loopOver) {
		if (arg.indexOf(":") > 0) {
			var idx = arg.indexOf(":");
			factions.push({ name: arg.substring(0, idx), reputation: arg.substring(idx + 1) });
		} else {
			factions.push({ name: arg, reputation: ns.getFactionRep(arg) });
		}
	}
	const database = JSON.parse(ns.read("database.txt"));
	// ns.tprintf("Factions: %s", JSON.stringify(factions))
	var toPurchase = getAugmentationsToPurchase(ns, database, factions);
	// ns.tprintf("Augmentations to buy: %v", toPurchase);
	var factor = 1.0;
	var sum = 0;
	if (!options.write) {
		ns.tprintf("%55s  %10s  %10s", "Augmentation", "Price", "Total");
	}
	for (var augmentation of toPurchase) {
		var toPay = factor * augmentation.price;
		sum += toPay;
		if (!options.write) {
			ns.tprintf("%55s: %10s  %10s", augmentation.name, formatMoney(toPay), formatMoney(sum));
		}
		factor = factor * 1.9;
	}

	if (options.write) {
		await ns.write("estimate.txt", JSON.stringify({ estimatedPrice: sum }), "w");
	}
}