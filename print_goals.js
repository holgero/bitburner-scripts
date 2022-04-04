import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const config = JSON.parse(ns.read("nodestart.txt"));
	ns.tprintf("%22s %20s %20s %10s  %s", "Faction", "Reputation Goal",
		"Current Reputation", "Completion", "Augmentations");
	for (var goal of config.factionGoals) {
		if (goal.reputation) {
			ns.tprintf("%22s %20d %20d %10s  %s",
				goal.name,
				goal.reputation,
				ns.getFactionRep(goal.name),
				(100 * ns.getFactionRep(goal.name) / goal.reputation).toFixed(1) + " %",
				augmentationsFrom(goal));
		} else {
			ns.tprintf("%22s %20s %20d", goal.name, "", ns.getFactionRep(goal.name));
		}
	}
	ns.tprintf("Estimated costs: augmentations: %s, donations: %s",
		formatMoney(config.estimatedPrice), formatMoney(config.estimatedDonations));
}

function augmentationsFrom(goal) {
	var result = "";
	for (var augmentation of goal.augmentations) {
		if (augmentation.reputation <= goal.reputation) {
			result = result + augmentation.augmentation.substring(0, 12) + ", ";
		}
	}
	return result.substring(0, result.length - 2);
}