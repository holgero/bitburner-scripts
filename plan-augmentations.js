import {
	getDatabase,
	getAvailableMoney,
	getAugmentationsToPurchase,
	runAndWait,
	filterExpensiveAugmentations
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

	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(augNames));
	if (options.run_purchase) {
		ns.spawn("purchase-augmentations.js", 1, JSON.stringify(augNames),
			"--reboot", JSON.stringify(options));
	}
}