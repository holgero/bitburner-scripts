import { GOVERNOR } from "constants.js";
import { getAugmentationsToPurchase } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["run_purchase", false], ["affordable", false]]);
	var factions = ns.getPlayer().factions.map(f => ({ name: f, reputation: ns.getFactionRep(f) }));
	var toPurchase = [];
	await getAugmentationsToPurchase(ns, factions, ns.getOwnedAugmentations(true), toPurchase);

	var governor_faction;
	var maxRep = 0;
	for (var factionElem of factions) {
		var faction = factionElem.name;
		var reputation = factionElem.reputation;
		if (ns.getAugmentationsFromFaction(faction).includes(GOVERNOR)) {
			if (reputation > maxRep) {
				governor_faction = faction;
				maxRep = reputation;
			}
		}
	}
	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(toPurchase));
	if (options.run_purchase) {
		ns.spawn("purchase-augmentations.js", 1, JSON.stringify(toPurchase),
			governor_faction, "--reboot", JSON.stringify(options));
	}
}