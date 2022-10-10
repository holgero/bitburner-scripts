import { getDatabase } from "./helpers.js";
import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const factionName = ns.args[0];
	const current = ns.singularity.getCurrentWork();
	if (current != null &&
		current.type == "FACTION" &&
		current.factionName == factionName
	) {
		ns.printf("Already working for %s", current.factionName);
		return;
	}
	if (current != null && current.type == "GRAFTING") {
		ns.printf("Currently grafting %s", current.augmentation);
		return;
	}

	const faction = getDatabase(ns).factions.find(a => a.name == factionName);
	if (faction.gang) {
		ns.tprintf("Cannot work for gang faction %s", factionName);
		return;
	}
	var bestGain = 0;
	for (var workType of [c.HACKING, c.SECURITY_WORK, c.FIELD_WORK]) {
		if (ns.fileExists("Formulas.exe")) {
			const gain = ns.formulas.work.factionGains(
				ns.getPlayer(), workType, faction.favor).reputation;
			if (gain > bestGain) {
				if (ns.singularity.workForFaction(factionName, workType)) {
					ns.printf("Working for faction %s, work type %s, gain %s",
						factionName, workType, gain);
					bestGain = gain;
				}
			}
		} else {
			if (ns.singularity.workForFaction(factionName, workType)) {
				ns.printf("Working for faction %s, work type %s", factionName, workType);
				bestGain = 1;
				break;
			}
		}
	}
	if (bestGain == 0) {
		ns.tprintf("Failed to work for faction %s, no suitable work type", factionName);
	}
}