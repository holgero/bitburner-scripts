/** @param {NS} ns **/
export async function main(ns) {
	var faction = ns.args[0];
	var worktype = ns.args[1];
	var focus = JSON.parse(ns.args[2]);
	ns.singularity.workForFaction(faction, worktype, focus);
}