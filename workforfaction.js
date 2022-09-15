/** @param {NS} ns **/
export async function main(ns) {
	var faction = ns.args[0];
	var worktype = ns.args[1];
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "FACTION" && current.factionName == faction) {
		ns.printf("Already working for %s", current.factionName);
		return;
	}
	ns.singularity.workForFaction(faction, worktype);
}
// {"type":"FACTION","cyclesWorked":159,"factionWorkType":"HACKING","factionName":"CyberSec"}