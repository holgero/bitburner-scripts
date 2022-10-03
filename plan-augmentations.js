import {
	getDatabase, getAvailableMoney, getAugmentationsToPurchase, runAndWait,
	setSortc
} from "helpers.js";
import { BLADEBURNERS } from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["run_purchase", false],
	["maxprice", 1e99],
	["keep", 0]]);
	if (options.run_purchase && ns.stock.hasTIXAPIAccess()) {
		await runAndWait(ns, "sell-all-stocks.js");
	}
	const database = getDatabase(ns);
	const factions = ns.getPlayer().factions.
		map(f => ({
			...(database.factions.find(a => a.name == f)),
			reputation: ns.singularity.getFactionRep(f)
		}));
	const toPurchase = getAugmentationsToPurchase(ns, database, factions, options.maxprice);
	var haveMoney = getAvailableMoney(ns, true) - options.keep;
	filterExpensiveAugmentations(ns, toPurchase, haveMoney, ["Hacking", "Bladeburner"]);
	const augNames = toPurchase.map(a => a.name);

	var governor_faction = factions[0].name;
	var maxRep = 0;
	for (var faction of factions) {
		if (faction.name != BLADEBURNERS && !faction.gang && (faction.reputation > maxRep)) {
			governor_faction = faction.name;
			maxRep = faction.reputation;
		}
	}
	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(augNames));
	ns.tprintf("Governor faction is %s (with rep %d)", governor_faction, maxRep);
	if (options.run_purchase) {
		ns.spawn("purchase-augmentations.js", 1, JSON.stringify(augNames),
			governor_faction, "--reboot", JSON.stringify(options));
	}
}

/** @param {NS} ns **/
function filterExpensiveAugmentations(ns, toPurchase, money, preferedTypes) {
	var len = toPurchase.length;
	while (canAfford(toPurchase, money) < toPurchase.length) {
		const idx = canAfford(toPurchase, money);
		if (idx > len) {
			ns.tprintf("Something is rotten %s %d", JSON.stringify(toPurchase), idx);
			ns.exit();
		}
		len--;
		if (idx == 0) {
			// screw that!
			toPurchase.splice(0, toPurchase.length);
			return;
		}
		if (findAugToRemove(ns, toPurchase, idx, preferedTypes)) {
			continue;
		}
		// only preferred types in toPurchase, remove the first not affordable aug
		toPurchase.splice(idx, 1);
		setSortc(toPurchase);
		toPurchase.sort((a, b) => a.sortc - b.sortc).reverse();
	}
}

function findAugToRemove(ns, toPurchase, idx, preferedTypes) {
	// find one aug between 0 and idx (inclusive) that can be removed
	// start with the most expensive aug (lowest index).
	for (var ii = 0; ii <= idx; ii++) {
		if (!preferedTypes.includes(toPurchase[ii].type)) {
			const removeAug = toPurchase[ii].name;
			ns.printf("Remove %s", removeAug);
			toPurchase.splice(ii, 1);
			const toKeep = toPurchase.filter(a => !a.requirements.includes(removeAug));
			toPurchase.splice(0, toPurchase.length);
			toPurchase.push(...toKeep);
			return true;
		}
	}
	return false;
}

function canAfford(toPurchase, money) {
	var factor = 1.0;
	var sum = 0;
	for (var ii = 0; ii < toPurchase.length; ii++) {
		var augmentation = toPurchase[ii];
		var toPay = factor * augmentation.price;
		if (sum + toPay > money) {
			return ii;
		}
		sum += toPay;
		factor = factor * 1.9;
	}
	return toPurchase.length;
}