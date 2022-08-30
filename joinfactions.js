/** @param {NS} ns */
export async function main(ns) {
	const config = JSON.parse(ns.read("factiongoals.txt"));
	const factions = config.factionGoals.map(a=>a.name);
	const invites = ns.singularity.checkFactionInvitations();
	for (var invite of invites) {
		if (factions.includes(invite)) {
			ns.singularity.joinFaction(invite);
		}
	}
}