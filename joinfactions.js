import { getDatabase, getFactiongoals } from "/helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["all", false]]);
	if (options.all) {
		ns.singularity.checkFactionInvitations().
			forEach(a => ns.singularity.joinFaction(a));
		return;
	}
	const database = getDatabase(ns);
	if (database.factions) {
		ns.singularity.checkFactionInvitations().
			map(a => database.factions.find(b => b.name == a)).
			filter(a => !a.location || a.location == "" || a.location != a.name).
			filter(a => a.augmentations.length > 0).
			forEach(a => ns.singularity.joinFaction(a.name));
	}
	const factiongoals = getFactiongoals(ns);
	if (factiongoals.factionGoals) {
		ns.singularity.checkFactionInvitations().
			filter(a => factiongoals.factionGoals.some(b => b.name == a)).
			forEach(a => ns.singularity.joinFaction(a));
	}
}