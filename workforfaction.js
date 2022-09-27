import { canRunAction } from "./helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (!canRunAction(ns, "work")) {
		ns.printf("Cannot work at the moment");
		return;
	}

	var faction = ns.args[0];
	var worktype = ns.args[1];
	const current = ns.singularity.getCurrentWork();
	if (current != null &&
		current.type == "FACTION" &&
		current.factionName == faction) {
		ns.printf("Already working for %s", current.factionName);
		return;
	}
	ns.singularity.workForFaction(faction, worktype);
}