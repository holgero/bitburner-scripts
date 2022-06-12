import { getAvailableMoney, getAugmentationsToPurchase, filterExpensiveAugmentations } from "helpers.js";
import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const factions = [ { name:c.BLADEBURNERS, reputation:ns.getFactionRep(c.BLADEBURNERS)}];
	const enoughRep = getAugmentationsToPurchase(ns, database, factions, 1e99);
	ns.tprintf("Have enough rep for %d augs", enoughRep.length);

	factions[0].reputation = 1e99;
	const myMoney = getAvailableMoney(ns, true);
	const enoughMoney = getAugmentationsToPurchase(ns, database, factions, myMoney);
	filterExpensiveAugmentations(ns, enoughMoney, myMoney);
	ns.tprintf("Have enough money for %d augs", enoughMoney.length);
}
