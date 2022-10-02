import { getDatabase, getAvailableMoney, formatMoney, getAugmentationsToPurchase, filterExpensiveAugmentations }
	from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["goal", false],
		["write", false],
		["affordable", false],
		["maxprice", 1e99]]);
	var factions = [];
	var loopOver = ns.getPlayer().factions;
	if (options._.length > 0) {
		loopOver = options._;
	} else {
		if (options.goal) {
			const config = JSON.parse(ns.read("factiongoals.txt"));
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
	const toPurchase = getAugmentationsToPurchase(ns, database, factions, options.maxprice);
	if (options.affordable) {
		filterExpensiveAugmentations(ns, toPurchase, getAvailableMoney(ns, true));
	}
	var factor = 1.0;
	var sum = 0;
	if (!options.write) {
		ns.tprintf("%55s  %10s  %10s  %10s", "Augmentation", "Base", "Price", "Total");
	}
	for (var augmentation of toPurchase) {
		var toPay = factor * augmentation.price;
		sum += toPay;
		if (!options.write) {
			ns.tprintf("%55s: %10s  %10s  %10s",
				augmentation.name, formatMoney(augmentation.price),
				formatMoney(toPay), formatMoney(sum));
		}
		factor = factor * 1.9;
	}

	if (options.write) {
		const augmentationCount = toPurchase.length;
		filterExpensiveAugmentations(ns, toPurchase, getAvailableMoney(ns, true));
		const affordableAugmentationCount = toPurchase.length;
		ns.write("estimate.txt", JSON.stringify({
			estimatedPrice: sum,
			augmentationCount: augmentationCount,
			affordableAugmentationCount: affordableAugmentationCount,
		}), "w");
	}
}