import { canRunAction, getDatabase } from "./helpers.js";
import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const faction = ns.args[0];
	if (!canRunAction(ns, "work")) {
		ns.printf("Cannot work at the moment");
		return;
	}
	const current = ns.singularity.getCurrentWork();
	if (current != null &&
		current.type == "FACTION" &&
		current.factionName == faction
	) {
		ns.printf("Already working for %s", current.factionName);
		return;
	}

	var bestGain = 0;
	const favor = getDatabase(ns).factions.find(a => a.name == faction).favor;
	for (var workType of [c.HACKING, c.SECURITY_WORK, c.FIELD_WORK]) {
		if (ns.fileExists("Formulas.exe")) {
			const gain = ns.formulas.work.factionGains(
				ns.getPlayer(), workType, favor).reputation;
			if (gain > bestGain) {
				if (ns.singularity.workForFaction(faction, workType)) {
					ns.printf("Working for faction %s, work type %s, gain %s",
						faction, workType, gain);
					bestGain = gain;
				}
			}
		} else {
			if (ns.singularity.workForFaction(faction, workType)) {
				ns.printf("Working for faction %s, work type %s", faction, workType);
				bestGain = 1;
				break;
			}
		}
	}
	if (bestGain == 0) {
		ns.tprintf("Failed to work for faction %s, no suitable work type", faction);
	}
}