/** @param {NS} ns **/
export async function main(ns) {
	const config = JSON.parse(ns.read("nodestart.txt"));
	ns.tprintf("%22s %20s %20s", "Faction", "Reputation Goal", "Current Reputation");
	for (var goal of config.factionGoals) {
		ns.tprintf("%22s %20d %20d", goal.name, goal.reputation, ns.getFactionRep(goal.name));
	}
}