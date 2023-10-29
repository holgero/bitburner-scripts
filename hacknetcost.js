import {
	formatMoney, getDatabase, getAvailableMoney, getHacknetProfitability,
} from "./helpers.js";

const RESERVE = 1e6;

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["weights", false]]);
	if (options.weights) {
		for (const weight of [1.05, 1.1, 1.15, 1.2]) {
			for (const ii of [1e6, 2e6, 5e6, 10e6, 100e6, 1e9]) {
				ns.tprintf("%s weighted with %f: %s",
					formatMoney(ii),
					weight,
					formatMoney(Math.pow(ii, weight)));
			}
			ns.tprintf("---");
		}
		return;
	}
	for (const nextCandidate of ["node", "level", "ram", "cores", "cache"]) {
		const cost = costForThing(ns, nextCandidate);
		ns.tprintf("Have %d of %s, upgrade will cost %s (weighted %s, available %s)",
			currentAmount(ns, nextCandidate),
			nextCandidate,
			formatMoney(cost),
			formatMoney(Math.pow(cost, 1.25)),
			formatMoney(availableMoney(ns)));
	}
}

/** @param {NS} ns */
function currentAmount(ns, which) {
	if (which == "node") {
		return ns.hacknet.numNodes();
	}
	return getLowest(ns, which);
}

/** @param {NS} ns */
function costForThing(ns, which) {
	const database = getDatabase(ns);
	switch (which) {
		case "node":
			return costForNextNode(ns);
		case "level":
			return costForNextThing(ns, ns.hacknet.getLevelUpgradeCost);
		case "ram":
			return costForNextThing(ns, ns.hacknet.getRamUpgradeCost);
		case "cores":
			return costForNextThing(ns, ns.hacknet.getCoreUpgradeCost);
		case "cache":
			if (database.features.hacknet) {
				return costForNextThing(ns, ns.hacknet.getCacheUpgradeCost);
			}
	}
	return Infinity;
}

/** @param {NS} ns */
function costForNextNode(ns) {
	if (ns.hacknet.maxNumNodes() > ns.hacknet.numNodes()) {
		return ns.hacknet.getPurchaseNodeCost();
	}
	return Infinity;
}

/** @param {NS} ns */
function costForNextThing(ns, costFunc) {
	var lowest = Infinity;
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		const thingCost = costFunc(ii);
		if (thingCost < lowest) {
			lowest = thingCost;
		}
	}
	return lowest;
}

/** @param {NS} ns */
function getLowest(ns, prop) {
	var lowest = Infinity;
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		const stats = ns.hacknet.getNodeStats(ii);
		if (stats[prop] < lowest) {
			lowest = stats[prop];
		}
	}
	return lowest;
}

/** @param {NS} ns */
function availableMoney(ns) {
	// spend about half of the available money on hacknet
	var available = getAvailableMoney(ns, false) / 2;
	// if hacknet is not profitable, spend less on it
	const multiplier = Math.sqrt(getHacknetProfitability(ns));
	if (multiplier < 1) {
		available = available * multiplier;
	}

	return Math.min(getAvailableMoney(ns, false) - RESERVE, available);
}