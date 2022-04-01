import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const config = JSON.parse(ns.read("nodestart.txt"));
	ns.tprintf("%22s %20s %20s %10s", "Faction", "Reputation Goal",
		"Current Reputation", "Completion");
	for (var goal of config.factionGoals) {
		ns.tprintf("%22s %20d %20d %10s", goal.name, goal.reputation,
		ns.getFactionRep(goal.name),
		goal.reputation ? (100*ns.getFactionRep(goal.name)/goal.reputation).toFixed(1) + " %":"");
	}
	ns.tprintf("Estimated costs: augmentations: %s, donations: %s",
		formatMoney(config.estimatedPrice), formatMoney(config.estimatedDonations));
}