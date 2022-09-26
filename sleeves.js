import * as c from "constants.js";
import { getAvailableMoney } from "helpers.js";

const POOR_MAN = 1e9;

/** @param {NS} ns */
export async function main(ns) {
	if (ns.sleeve.getNumSleeves() <= 0) {
		return;
	}
	await runSleeves(ns);
}

/** @param {NS} ns */
async function runSleeves(ns) {
	while (getAvailableMoney(ns) < POOR_MAN ||
		ns.scriptRunning("joinbladeburner.js", "home")) {
		for (var ii = 0; ii < ns.sleeve.getNumSleeves(); ii++) {
			if (sleeveHasLowSkills(ns, ii)) {
				if (trainSkills(ns, ii)) {
					continue;
				}
			}
			ns.sleeve.setToCommitCrime(ii, getCrimeType(ns, ii));
		}
		await ns.sleep(60000);
	}
	const available = [];
	for (var ii = 0; ii < ns.sleeve.getNumSleeves(); ii++) {
		const skills = ns.sleeve.getSleeveStats(ii);
		if (skills.sync < 100) {
			ns.sleeve.setToSynchronize(ii);
			continue;
		}
		if (skills.shock > 0) {
			ns.sleeve.setToShockRecovery(ii);
			continue;
		}
		ns.sleeve.setToCommitCrime(ii, getCrimeType(ns, ii));
		available.push(ii);
	}

	if (ns.fileExists("factiongoals.txt")) {
		const goals = JSON.parse(ns.read("factiongoals.txt"));
		const factions = ns.getPlayer().factions;
		const factionsToWorkFor = goals.factionGoals.filter(a => factions.includes(a.name) && ns.singularity.getFactionRep(a.name) < a.reputation);
		for (var faction of factionsToWorkFor) {
			for (var idx = 0; idx < available.length; idx++) {
				if (ns.sleeve.setToFactionWork(available[idx], faction.name, c.SECURITY_WORK) ||
					ns.sleeve.setToFactionWork(available[idx], faction.name, c.FIELD_WORK)) {
					available.splice(idx, 1);
					break;
				}
			}
		}
		const jobsToWorkFor = goals.factionGoals.filter(a => a.company && !factions.includes(a.name));
		for (var job of jobsToWorkFor) {
			for (var idx = 0; idx < available.length; idx++) {
				if (ns.sleeve.setToCompanyWork(available[idx], job.name)) {
					available.splice(idx, 1);
					break;
				}
			}
		}
	}
}

/** @param {NS} ns */
function getCrimeType(ns, sleeveNo) {
	const skills = ns.sleeve.getSleeveStats(sleeveNo);
	if (skills.agility < 25 || skills.dexterity < 25) {
		return "Shoplift";
	}
	if (skills.strength < 40 || skills.defense < 40) {
		return "Mug";
	}
	return "Homicide";
}

/** @param {NS} ns */
function sleeveHasLowSkills(ns, sleeveNo) {
	const skills = ns.sleeve.getSleeveStats(sleeveNo);
	if (skills.agility < 12 || skills.dexterity < 12) {
		return true;
	}
	return false;
}

/** @param {NS} ns */
function trainSkills(ns, sleeveNo) {
	for (var faction of ns.getPlayer().factions) {
		try {
			if (ns.sleeve.setToFactionWork(sleeveNo, faction, c.SECURITY_WORK)) {
				return true;
			}
			if (ns.sleeve.setToFactionWork(sleeveNo, faction, c.FIELD_WORK)) {
				return true;
			}
		} catch (error) {
			ns.printf("%s", JSON.stringify(error));
		}
	}
	return false;
}