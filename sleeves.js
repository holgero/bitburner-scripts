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
	while (getAvailableMoney(ns) < POOR_MAN) {
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
	}
}

/** @param {NS} ns */
function getCrimeType(ns, sleeveNo) {
	const skills = ns.sleeve.getSleeveStats(sleeveNo);
	if (skills.agility < 25 || skills.dexterity < 25) {
		return "Shoplift";
	}
	if (skills.strength < 30 || skills.defense < 30) {
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