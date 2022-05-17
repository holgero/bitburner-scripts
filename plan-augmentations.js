import { GOVERNOR } from "constants.js";
import { getAugmentationsToPurchase } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["run_purchase", false], ["affordable", false]]);
	var factions = ns.getPlayer().factions.map(f => ({ name: f, reputation: ns.getFactionRep(f) }));
	const database = JSON.parse(ns.read("database.txt"));
	var toPurchase = getAugmentationsToPurchase(ns, database, factions);

	var governor_faction;
	var maxRep = 0;
	for (var faction of factions) {
		if (faction.reputation > maxRep) {
			governor_faction = faction.name;
			maxRep = faction.reputation;
		}
	}
	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(toPurchase));
	ns.tprintf("Governor faction is %s (with rep %d)", governor_faction, maxRep);
	if (options.run_purchase) {
		ns.spawn("purchase-augmentations.js", 1, JSON.stringify(toPurchase),
			governor_faction, "--reboot", JSON.stringify(options));
	}
}