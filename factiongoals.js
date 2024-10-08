import * as c from "constants.js";
import {
	runAndWait,
	getDatabase,
	getFactiongoals,
	getEstimation,
	reputationNeeded,
	getAvailableMoney,
	goalCompletion,
	getRestrictions
} from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = getDatabase(ns);
	const bitNode = ns.getResetInfo().currentNode;
	if (c.BLADEBURNER_NODES.includes(bitNode) &&
		!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		const restrictions = getRestrictions(ns);
		if (!restrictions || !restrictions.nobladeburner) {
			ns.printf("On a bladeburner bitnode (%d) without the %s", bitNode, c.BLADE_SIMUL);
			return;
		}
	}
	if (bitNode != 8 && !(await prepareGoalWork(ns, database))) {
		return;
	}
	const config = await getAndCheckFactiongoals(ns, database);
	await checkForDaedalus(ns, database, config);
	await runAndWait(ns, "factionaction.js");
	await avoidOverachievement(ns, database, config);
	await runAndWait(ns, "commit-crimes.js", "--on-idle");
}

/** @param {NS} ns **/
async function getAndCheckFactiongoals(ns, database) {
	const config = getFactiongoals(ns);
	if (config.factionGoals && checkFactiongoals(ns, database, config.factionGoals)) {
		ns.printf("Keeping existing goals");
		return config;
	}
	await runAndWait(ns, "calculate-goals.js");
	return getFactiongoals(ns);
}

/** @param {NS} ns **/
function checkFactiongoals(ns, database, goals) {
	if (goalCompletion(ns, goals) < 0.05) return false;
	if (goalCompletion(ns, goals) >= 0.95) return false;
	if (goals.some(a => a.reputation && database.factions.find(b => b.name == a.name).gang)) return false;
	// check if all possible goals have been reached
	const factions = ns.getPlayer().factions;
	if (goalCompletion(ns, goals.filter(a => a.reputation && factions.includes(a.name))) >= 1.00) return false;

	return true;
}

/** @param {NS} ns **/
async function prepareGoalWork(ns, database) {
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
	const multi = database.bitnodemultipliers ? database.bitnodemultipliers.CrimeMoney : 1;
	if (getAvailableMoney(ns) < 500e3 * multi) {
		await runAndWait(ns, "commit-crimes.js");
		return false;
	}
	return true;
}

/** @param {NS} ns **/
async function avoidOverachievement(ns, database, config) {
	const current = ns.singularity.getCurrentWork();
	// ","cyclesWorked":24,"factionWorkType":"hacking","factionName":"Daedalus"}
	if (current && current.type == "FACTION") {
		const goal = config.factionGoals.find(a => a.name == current.factionName);
		const achieved = ns.singularity.getFactionRep(goal.name);
		const possibleAugs = database.augmentations.filter(
			a => a.factions.includes(current.factionName) &&
				a.reputation > achieved);
		const remainingAugs = database.augmentations.filter(a => a.type != "Infiltration");
		if (remainingAugs.length > 0 && possibleAugs.length == 0) {
			ns.tprintf("No sense working for %s, because our reputation is already %d",
				current.factionName, achieved);
			ns.singularity.stopAction();
		}
	}
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
		const redPill = database.augmentations.find(a => a.name == c.RED_PILL);
		if (goal.favor < database.favorToDonate) {
			goal.reputation = reputationNeeded(ns, database, goal.name);
			if (goal.favor <= 1 && goal.reputation >= 400000 &&
				ns.singularity.getFactionRep(goal.name) < 0.5 * goal.reputation) {
				// no favor yet, do a first step to gain about 100 favor, in order to
				// half the time to reach the favor to donate threshold
				goal.reputation = 160000;
			}
			if (goal.favor < 220 && goal.reputation >= 4e6 &&
				ns.singularity.getFactionRep(goal.name) < 0.5 * goal.reputation) {
				// do an additional step if favor to donate is really high
				goal.reputation = 2e6;
			}
			config.estimatedDonations = 0;
			if (goal.reputation > redPill.reputation) {
				// cap at red pill
				goal.reputation = redPill.reputation;
			}
		} else {
			// reach the red pill
			goal.reputation = redPill.reputation;
			config.estimatedDonations = 1;
		}
		// ns.tprintf("Writing modified factiongoal");
		ns.write("factiongoals.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: 0,
			estimatedDonations: config.estimatedDonations
		}), "w");
		config.estimatedPrice = (await getEstimation(ns, true)).estimatedPrice;
		if (goal.reputation == redPill.reputation) {
			// do not hold back with donations just for a few extra (possibly unnecessary) augmentations
			config.estimatedPrice = redPill.price;
		}
		// ns.tprintf("Writing modified factiongoal with estimation");
		ns.write("factiongoals.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: config.estimatedPrice,
			estimatedDonations: config.estimatedDonations
		}), "w");
	}
}