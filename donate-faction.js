/** @param {NS} ns **/
export async function main(ns) {
	var faction = ns.args[0];
	var reputation = ns.args[1];
	var maximum = ns.args[2];
	var money = costToBribeTo(ns, faction, reputation);
	ns.donateToFaction(faction, Math.min(money, maximum));
}

/** @param {NS} ns **/
function costToBribeTo(ns, faction, reputation) {
	if (ns.getFactionFavor(faction) < ns.getFavorToDonate()) {
		return 0;
	}
	var needed = Math.max(0, reputation - ns.getFactionRep(faction));
	var cost = 1000000 * needed / ns.getPlayer().faction_rep_mult;
	return cost;
}