import * as c from "constants.js";
import { getDatabase, getFactiongoals, getAvailableMoney, runAndWait } from "helpers.js";

const POOR_MAN = 1e9;

/** @param {NS} ns */
export async function main(ns) {
	const database = getDatabase(ns);
	if (!database.features.sleeves) {
		return;
	}
	if (ns.sleeve.getNumSleeves() <= 0) {
		return;
	}
	await runSleeves(ns);
}

/** @param {NS} ns */
async function runSleeves(ns) {
	if ((ns.getPlayer().bitNodeN != 8 && getAvailableMoney(ns) < POOR_MAN) ||
		ns.heart.break() > -54000 ||
		ns.scriptRunning("joinbladeburner.js", "home")) {
		const sleeves = [];
		for (var ii = 0; ii < ns.sleeve.getNumSleeves(); ii++) {
			ns.sleeve.setToCommitCrime(ii, getCrimeType(ns, ii));
			if (sleeveHasLowSkills(ns, ii)) {
				sleeves.push(ii);
			}
		}
		sleeves.sort((a, b) => getSleeveStatSum(ns, a) - getSleeveStatSum(ns, b));
		ns.printf("Sleeve training order: %s", sleeves);

		for (var ii of sleeves) {
			if (!trainSkills(ns, ii)) {
				break;
			}
		}
		return;
	}
	const available = [];
	for (var ii = 0; ii < ns.sleeve.getNumSleeves(); ii++) {
		const sleeve = ns.sleeve.getSleeve(ii);
		if (sleeve.sync < 100) {
			ns.sleeve.setToSynchronize(ii);
			continue;
		}
		if (sleeve.shock > 0) {
			ns.sleeve.setToShockRecovery(ii);
			continue;
		}
		available.push(ii);
	}
	if (available.length == 0) {
		ns.print("No sleeves available for work");
		return;
	}
	const goals = getFactiongoals(ns);
	if (goals.factionGoals) {
		ns.print("Available sleeves for faction work: ", available);
		const factions = ns.getPlayer().factions;
		const database = getDatabase(ns);
		const factionsToWorkForPrefered = goals.factionGoals.
			filter(a => factions.includes(a.name) && a.reputation &&
				ns.singularity.getFactionRep(a.name) < a.reputation).
			filter(a => !database.factions.find(b => a.name == b.name).gang);
		for (var faction of factionsToWorkForPrefered) {
			for (var idx = 0; idx < available.length; idx++) {
				if (workForFaction(ns, available[idx], faction.name, c.SECURITY_WORK) ||
					workForFaction(ns, available[idx], faction.name, c.FIELD_WORK)) {
					available.splice(idx, 1);
					break;
				}
			}
		}
		ns.print("Available sleeves for company work: ", available);
		const jobsToWorkFor = goals.factionGoals.
			filter(a => a.company).
			filter(a => !ns.getPlayer().factions.includes(a.name));
		for (var job of jobsToWorkFor) {
			if (!ns.getPlayer().jobs[job.name]) {
				await runAndWait(ns, "workforcompany.js",
					"--apply", "--company", job.name, "--job", "IT");
			}
			if (!ns.singularity.getCurrentWork() ||
				!ns.singularity.getCurrentWork()["companyName"] == job.name) {
				await runAndWait(ns, "workforcompany.js",
					"--apply", "--company", job.name, "--job", "Security");
			}
			for (var idx = 0; idx < available.length; idx++) {
				if (workForCompany(ns, available[idx], job.name)) {
					available.splice(idx, 1);
					break;
				}
			}
		}
		ns.print("Still available sleeves: ", available);
		const factionsToWorkFor = goals.factionGoals.
			filter(a => factions.includes(a.name) && !(a.reputation ||
				ns.singularity.getFactionRep(a.name) < a.reputation)).
			filter(a => !database.factions.find(b => a.name == b.name).gang);
		for (var faction of factionsToWorkFor) {
			for (var idx = 0; idx < available.length; idx++) {
				if (workForFaction(ns, available[idx], faction.name, c.SECURITY_WORK) ||
					workForFaction(ns, available[idx], faction.name, c.FIELD_WORK)) {
					available.splice(idx, 1);
					break;
				}
			}
		}
		if (database.features.bladeburners && available.length) {
			ns.print("Still available sleeves: ", available);
			var task = ns.sleeve.getTask(available[0]);
			// ns.tprintf("Sleeve doing %s", JSON.stringify(task));
			if (!task || task.type != "BLADEBURNER" || task.actionName != "Field Analysis") {
				ns.sleeve.setToBladeburnerAction(available[0], "Field analysis");
			}
			available.splice(0, 1);
			if (available.length > 0) {
				task = ns.sleeve.getTask(available[0]);
				// ns.tprintf("Sleeve doing %s", JSON.stringify(task));
				if (!task || task.type != "BLADEBURNER" || task.actionName != "Diplomacy") {
					ns.sleeve.setToBladeburnerAction(available[0], "Diplomacy");
				}
				available.splice(0, 1);
			}
		}
	}
	for (var idx = 0; idx < available.length; idx++) {
		ns.sleeve.setToCommitCrime(available[idx], getCrimeType(ns, available[idx]));
	}
}

/** @param {NS} ns */
function getCrimeType(ns, sleeveNo) {
	const skills = ns.sleeve.getSleeve(sleeveNo).skills;
	if (skills.agility < 25 || skills.dexterity < 25) {
		return "Shoplift";
	}
	if (skills.strength < 60 || skills.defense < 60) {
		return "Mug";
	}
	return "Homicide";
}

/** @param {NS} ns */
function getSleeveStatSum(ns, sleeveNo) {
	const skills = ns.sleeve.getSleeve(sleeveNo).skills;
	return skills.agility + skills.dexterity + skills.defense + skills.strength;
}

/** @param {NS} ns */
function sleeveHasLowSkills(ns, sleeveNo) {
	const skills = ns.sleeve.getSleeve(sleeveNo).skills;
	if (skills.agility < 12 || skills.dexterity < 12) {
		return true;
	}
	return false;
}

/** @param {NS} ns */
function workForFaction(ns, sleeveNo, factionName, workType) {
	try {
		if (ns.sleeve.setToFactionWork(sleeveNo, factionName, workType)) {
			ns.printf("Sleeve %d works '%s' for faction %s", sleeveNo, workType, factionName);
			return true;
		}
	} catch (error) {
		ns.printf("%s", JSON.stringify(error));
	}
	return false;
}

/** @param {NS} ns */
function workForCompany(ns, sleeveNo, companyName) {
	try {
		if (ns.sleeve.setToCompanyWork(sleeveNo, companyName)) {
			ns.printf("Sleeve %d works for company %s", sleeveNo, companyName);
			return true;
		}
	} catch (error) {
		ns.printf("%s", JSON.stringify(error));
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