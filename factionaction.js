import { runAndWait, getFactiongoals, getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const config = getFactiongoals(ns);
	const goal = selectGoal(ns, config);
	if (goal) {
		await workOnGoal(ns, goal, config);
	}
}

/** @param {NS} ns **/
function selectGoal(ns, config) {
	const player = ns.getPlayer();
	const factions = player.factions;
	const companyGoals = config.factionGoals.
		filter(a => a.reputation && a.company &&
			!factions.includes(a.name) && player.skills.hacking >= a.hack);
	if (companyGoals.length > 0) {
		return companyGoals[0];
	}
	const goals = config.factionGoals.
		filter(a => a.reputation && factions.includes(a.name));
	goals.forEach(a => a.achieved = ns.singularity.getFactionRep(a.name));
	goals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved));
	goals.reverse();
	return goals[0];
}

/** @param {NS} ns **/
async function workOnGoal(ns, goal, config) {
	ns.printf("goal: %s %d", goal.name, goal.reputation);
	if (config.estimatedDonations) {
		var moneyForDonations = Math.max(0, getAvailableMoney(ns) - config.estimatedPrice);
		if (moneyForDonations) {
			ns.printf("Will donate %d", moneyForDonations);
			await runAndWait(ns, "donate-faction.js", goal.name, goal.reputation, moneyForDonations);
		}
	}
	const goalRep = goal.reputation + (goal.company ? 400e3 : 0);
	const repReached = ns.singularity.getFactionRep(goal.name) +
		(goal.company ? Math.min(400e3, ns.singularity.getCompanyRep(goal.name)) : 0);
	if (repReached > goalRep) {
		return;
	}
	var percentComplete = (100.0 * repReached / goalRep).toFixed(1);
	ns.printf("Goal completion (%s %d/%d): %s %%",
		goal.name, repReached, goalRep, percentComplete);
	ns.toast(goal.name + ": " + percentComplete + " %", "success", 5000);
	if (goal.company && !ns.getPlayer().factions.includes(goal.name)) {
		ns.printf("Work for company %s", goal.name);
		await runAndWait(ns, "workforcompany.js", "--apply", "--work",
			"--company", goal.name, "--job", "IT");
	} else {
		ns.printf("Work for faction %s", goal.name);
		await runAndWait(ns, "workforfaction.js", goal.name);
	}
}