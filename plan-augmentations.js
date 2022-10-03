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