import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["direct", ""]]);
	var config;
	if (options.direct) {
		config = JSON.parse(options.direct);
	} else {
		config = JSON.parse(ns.read("nodestart.txt"));
	}
	const database = JSON.parse(ns.read("database.txt"));
	ns.tprintf("%22s %10s %10s %10s  %s", "Faction", "Goal",
		"Current", "Completion", "Augmentations");
	for (var goal of config.factionGoals) {
		if (goal.reputation) {
			ns.tprintf("%22s %10d %10d %10s  %s",
				goal.name,
				goal.reputation,
				ns.getFactionRep(goal.name),
				(100 * ns.getFactionRep(goal.name) / goal.reputation).toFixed(1) + " %",
				augmentationsFrom(ns, database, goal));
		} else {
			ns.tprintf("%22s %10s %10d", goal.name, "", ns.getFactionRep(goal.name));
		}
	}
	ns.tprintf("Estimated costs: augmentations: %s, donations: %s",
		formatMoney(config.estimatedPrice), formatMoney(config.estimatedDonations));
}

function augmentationsFrom(ns, database, goal) {
	var result = "";
	for (var augName of goal.augmentations) {
		var augmentation = database.augmentations.find(a=>a.name == augName);
		if (augmentation.reputation <= Math.max(goal.reputation, ns.getFactionRep(goal.name))) {
			result = result + augmentation.name.substring(0, 14) + ", ";
		}
	}
	return result.substring(0, result.length - 2);
}