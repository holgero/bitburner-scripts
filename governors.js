import { getAvailableMoney, getDatabase, formatMoney } from "helpers.js";
import { GOVERNOR, BLADEBURNERS } from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const database = getDatabase(ns);
	const factions = ns.getPlayer().factions.
		filter(a => a != BLADEBURNERS).
		map(f => ({
			...(database.factions.find(a => a.name == f)),
			reputation: ns.singularity.getFactionRep(f)
		})).
		filter(a=>!a.gang).
		sort((a,b) => a.reputation - b.reputation).reverse();

	var governor_faction = factions[0].name;
	ns.tprintf("Use %s to buy governors", governor_faction);
	
	while (getAvailableMoney(ns, true) > ns.singularity.getAugmentationPrice(GOVERNOR)) {
		if (ns.singularity.purchaseAugmentation(governor_faction, GOVERNOR)) {
			ns.tprintf("Bought governor, money left: %s",
			 formatMoney(getAvailableMoney(ns, true)));
			await ns.sleep(500);
		} else {
			break;
		}
	}
}