import { getAvailableMoney, getDatabase, formatMoney, runAndWait } from "helpers.js";
import { GOVERNOR, BLADEBURNERS, CHURCH } from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const database = getDatabase(ns);
	const factions = ns.getPlayer().factions.
		filter(a => a != BLADEBURNERS && a != CHURCH).
		map(f => ({
			...(database.factions.find(a => a.name == f)),
			reputation: ns.singularity.getFactionRep(f)
		})).
		filter(a => !a.gang).
		sort((a, b) => a.reputation - b.reputation).reverse();

	if (factions.length == 0) {
		return;
	}
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
	if (getAvailableMoney(ns, true) > ns.singularity.getAugmentationPrice(GOVERNOR)) {
		ns.tprintf("Still enough money to buy governors, trying to bribe a faction");
		await runAndWait(ns, "joinfactions.js", "--all");
		const bribeFactions = ns.getPlayer().factions.
			filter(a => a != BLADEBURNERS && a != CHURCH).
			filter(a => ns.singularity.getFactionFavor(a) > ns.getFavorToDonate()).
			map(f => ({
				...(database.factions.find(a => a.name == f)),
				reputation: ns.singularity.getFactionRep(f)
			})).
			filter(a => !a.gang).
			sort((a, b) => a.reputation - b.reputation).reverse();
		if (bribeFactions.length == 0) {
			ns.tprintf("Didn't find a faction with big enough favor");
			return;
		}
		governor_faction = bribeFactions[0].name;
		ns.tprintf("Use %s to bribe and buy governors", governor_faction);
		while (getAvailableMoney(ns, true) > ns.singularity.getAugmentationPrice(GOVERNOR)) {
			const repNeeded = ns.singularity.getAugmentationRepReq(GOVERNOR);
			const moneyForDonations = getAvailableMoney(ns, true) - ns.singularity.getAugmentationPrice(GOVERNOR);
			await runAndWait(ns, "donate-faction.js", governor_faction, repNeeded, moneyForDonations);
			await ns.sleep(100);

			if (ns.singularity.purchaseAugmentation(governor_faction, GOVERNOR)) {
				ns.tprintf("Bought governor, money left: %s",
					formatMoney(getAvailableMoney(ns, true)));
				await ns.sleep(500);
			} else {
				break;
			}
		}
	}
}