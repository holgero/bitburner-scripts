import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const faction = ns.args[0];
	if (ns.singularity.getFactionFavor(faction) < ns.getFavorToDonate()) {
		ns.printf("Cannot donate to faction %s, need favor %d, have %d",
			faction, ns.getFavorToDonate(), ns.singularity.getFactionFavor(faction));
		return;
	}
	const reputation = ns.args[1];
	const maximum = ns.args[2];
	if (reachableReputationPercentage(ns, faction, reputation, maximum) > 0.9) {
		const money = costToBribeTo(ns, faction, reputation);
		if (money > 0) {
			ns.singularity.donateToFaction(faction, Math.min(money, maximum));
		}
	}
}

/** @param {NS} ns **/
function costToBribeTo(ns, faction, reputation) {
	var needed = Math.max(0, reputation - ns.singularity.getFactionRep(faction));
	var cost = 1e6 * needed / ns.getPlayer().mults.faction_rep;
	return cost;
}

/** @param {NS} ns **/
function reachableReputationPercentage(ns, faction, reputation, money) {
	const reachable = Math.min(reputation,
		ns.singularity.getFactionRep(faction) + money * ns.getPlayer().mults.faction_rep / 1e6);
	const moneyNeeded = costToBribeTo(ns, faction, reachable);
	ns.printf("Can reach %s reputation (%s %%) with %s by donating %s",
		Math.floor(reachable), (100 * reachable / reputation).toFixed(1), faction,
		formatMoney(moneyNeeded));
	return reachable / reputation;
}