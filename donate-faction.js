import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const faction = ns.args[0];
	const reputation = ns.args[1];
	const maximum = ns.args[2];
	if (reachableReputationPercentage(ns, faction, reputation, maximum) > 0.8) {
		const money = costToBribeTo(ns, faction, reputation);
		ns.singularity.donateToFaction(faction, Math.min(money, maximum));
	}
}

/** @param {NS} ns **/
function costToBribeTo(ns, faction, reputation) {
	if (ns.singularity.getFactionFavor(faction) < ns.getFavorToDonate()) {
		return 0;
	}
	var needed = Math.max(0, reputation - ns.singularity.getFactionRep(faction));
	var cost = 1e6 * needed / ns.getPlayer().mults.faction_rep;
	return cost;
}

/** @param {NS} ns **/
function reachableReputationPercentage(ns, faction, reputation, money) {
	const reachable = ns.singularity.getFactionRep(faction) + money * ns.getPlayer().mults.faction_rep / 1e6;
	ns.tprintf("Can reach %s reputation (%s %%) with %s by donating %s",
	 Math.floor(reachable), (100*reachable/reputation).toFixed(1), faction, formatMoney(money));
	return reachable / reputation;
}