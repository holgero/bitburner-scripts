import {
	getDatabase,
	getFactiongoals,
	getAvailableMoney,
	formatMoney,
	getAugmentationsToPurchase,
	filterExpensiveAugmentations,
	findBestAugmentations,
	getAugmentationPrios
}
	from "helpers.js";
import { GOVERNOR, BLADEBURNERS } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["goal", false],
		["write", false],
		["affordable", false],
		["maxprice", 1e99],
		["best", false],
		["governor", false],
		["money", 0]]);
	var factions = [];
	var loopOver = ns.getPlayer().factions;
	if (options._.length > 0) {
		loopOver = options._;
	} else {
		if (options.goal) {
			const config = getFactiongoals(ns);
			for (var goal of config.factionGoals) {
				if (loopOver.includes(goal.name)) {
					var idx = loopOver.indexOf(goal.name);
					loopOver.splice(idx, 1);
				}
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
			factions.push({ name: arg, reputation: ns.singularity.getFactionRep(arg) });
		}
	}
	const database = getDatabase(ns);
	// ns.tprintf("Factions: %s", JSON.stringify(factions))
	var toPurchase = getAugmentationsToPurchase(ns, database, factions, options.maxprice);
	const augmentationCount = toPurchase.length;
	const money = options.money ? options.money : getAvailableMoney(ns, true);
	const prioritized = getAugmentationPrios(ns).slice(0, 3);
	if (options.best) {
		toPurchase = await findBestAugmentations(ns);
	}
	if (options.affordable) {
		filterExpensiveAugmentations(ns, toPurchase, money, prioritized);
	}
	var factor = 1.0;
	var sum = 0;
	if (!options.write) {
		ns.tprintf("%55s  %10s  %10s  %10s %s", "Augmentation", "Base", "Price", "Total", "Prio");
	}
	for (var augmentation of toPurchase) {
		var toPay = factor * augmentation.price;
		sum += toPay;
		if (!options.write) {
			ns.tprintf("%55s: %10s  %10s  %10s %s",
				augmentation.name, formatMoney(augmentation.price),
				formatMoney(toPay), formatMoney(sum),
				prioritized.includes(augmentation.type) ? "*" : "");
		}
		factor = factor * 1.9;
	}

	filterExpensiveAugmentations(ns, toPurchase, money, prioritized);
	const affordableAugmentationCount = toPurchase.length;
	var prioritizedAugmentationCount = 0;
	for (var augmentation of toPurchase) {
		if (prioritized.includes(augmentation.type)) {
			prioritizedAugmentationCount++;
		}
	}
	var governors = 0;
	var sumAfterGovernors = sum;
	if (options.governor) {
//		var governorRep = ns.singularity.getAugmentationRepReq(GOVERNOR);
	//	var governorPrice = ns.singularity.getAugmentationPrice(GOVERNOR);
		ns.tprintf("Have %s left to spend on governors (base price: %s, with factor: %s, base rep: %d)",
			formatMoney(money - sumAfterGovernors), formatMoney(governorPrice), 
			formatMoney(governorPrice * factor), governorRep);
		while (money > sumAfterGovernors + factor * governorPrice) {
			governors ++;
			sumAfterGovernors += factor * governorPrice;
			governorRep *= 1.14;
			factor *= 1.9;
		}
		ns.tprintf("Have %s left to spend after buying %d governors.",
			formatMoney(money - sumAfterGovernors), governors);
	}

	if (options.write) {
		ns.write("estimate.txt", JSON.stringify({
			estimatedPrice: sum,
			augmentationCount: augmentationCount,
			affordableAugmentationCount: affordableAugmentationCount,
			prioritizedAugmentationCount: prioritizedAugmentationCount,
			affordableAugmentations: toPurchase,
		}), "w");
	} else {
		ns.tprintf("Total price: %s, possible augmentations: %s, " +
			"affordable augmentations %s, prioritized augmentations %s",
			formatMoney(sum), augmentationCount,
			affordableAugmentationCount, prioritizedAugmentationCount);
	}
}