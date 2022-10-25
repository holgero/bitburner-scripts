import * as c from "constants.js";
import {
	runAndWait,
	getDatabase,
	getFactiongoals,
	getEstimation,
	reputationNeeded,
	getAvailableMoney,
	goalCompletion
} from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = getDatabase(ns);
	const player = ns.getPlayer();
	if (c.BLADEBURNER_NODES.includes(player.bitNodeN) &&
		!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		ns.printf("On a bladeburner bitnode (%d) without the %s",
			player.bitNodeN, c.BLADE_SIMUL);
		return;
	}
	if (!(await prepareGoalWork(ns))) {
		return;
	}
	var config = getFactiongoals(ns);
	if (!config.factionGoals ||
	 goalCompletion(ns, config.factionGoals) >= 1 ||
	 goalCompletion(ns, config.factionGoals) < 0.1) {
		await runAndWait(ns, "calculate-goals.js");
		config = getFactiongoals(ns);
	} else {
		ns.printf("Keeping existing goals");
	}
	await checkForDaedalus(ns, database, config);
	await runAndWait(ns, "factionaction.js");
	await runAndWait(ns, "commit-crimes.js", "--on-idle");
}

/** @param {NS} ns **/
async function prepareGoalWork(ns) {
	// first hacking level to fifty
	if (ns.getPlayer().skills.hacking < 50) {
		await runAndWait(ns, "university.js", "--course", "CS", "--negative");
		return false;
	}
	const current = ns.singularity.getCurrentWork();
	if (current && current.type == "CLASS") {
		ns.singularity.stopAction();
	}
	// then make sure we have a little bit of money
	if (getAvailableMoney(ns) < 500e3) {
		await runAndWait(ns, "commit-crimes.js");
		return false;
	}
	return true;
}

/** @param {NS} ns **/
async function checkForDaedalus(ns, database, config) {
	// ns.tprintf("Check for daedalus")
	if (!ns.getPlayer().factions.includes(c.DAEDALUS)) {
		return;
	}
	const goals = config.factionGoals;
	if (goals.some(a => a.name == c.DAEDALUS && a.augmentations.includes(c.RED_PILL))) {
		var goal = goals.find(a => a.name == c.DAEDALUS);
		// single minded now, there are no other goals...
		goals.forEach(a => a.reputation = 0);
		if (goal.favor < database.favorToDonate) {
			goal.reputation = reputationNeeded(ns, database, goal.name);
			config.estimatedDonations = 0;
		} else {
			// reach the red pill
			goal.reputation = database.augmentations.find(a => a.name == c.RED_PILL).reputation;
			config.estimatedDonations = 1;
		}
		// ns.tprintf("Writing modified factiongoal");
		ns.write("factiongoals.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: 0,
			estimatedDonations: config.estimatedDonations
		}), "w");
		config.estimatedPrice = (await getEstimation(ns, true)).estimatedPrice;
		// ns.tprintf("Writing modified factiongoal with estimation");
		ns.write("factiongoals.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: config.estimatedPrice,
			estimatedDonations: config.estimatedDonations
		}), "w");
	}
}