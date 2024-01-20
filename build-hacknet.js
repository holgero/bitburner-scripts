import {
	getDatabase,
	getAvailableMoney,
	formatMoney,
	getHacknetProfitability,
	getRestrictions
} from "/helpers.js";

const RESERVE = 1e6;
const WEIGHT = 1.25;

/** @param {NS} ns */
export async function main(ns) {
	const restrictions = getRestrictions(ns);
	if (restrictions && restrictions.nohacknet) {
		return;
	}
	ns.disableLog("getServerMoneyAvailable");
	const available = availableMoney(ns);
	if (available <= 0) {
		return;
	}
	ns.printf("Can spend %s on hacknet.", formatMoney(available));

	var totalMoneySpent = 0;
	do {
		const moneySpent = spendMoney(ns);
		if (moneySpent == 0) {
			break;
		}
		totalMoneySpent += moneySpent;
	} while (true);

	if (totalMoneySpent > 0) {
		ns.printf("Hacknet: spent %s", formatMoney(totalMoneySpent));
	}
}

/** @param {NS} ns */
function spendMoney(ns) {
	var cheapest = Infinity;
	var nextThing = "";
	for (const nextCandidate of ["node", "level", "ram", "core", "cache"]) {
		if (costForThing(ns, nextCandidate) < cheapest) {
			cheapest = costForThing(ns, nextCandidate);
			nextThing = nextCandidate;
		}
	}
	ns.printf("Cheapest is %s, will cost %s (weighted %s, available %s)",
		nextThing,
		formatMoney(cheapest),
		formatMoney(Math.pow(cheapest, WEIGHT)),
		formatMoney(availableMoney(ns)));
	var moneySpent = 0;
	while (Math.pow(cheapest, WEIGHT) < availableMoney(ns)) {
		if (!upgradeThing(ns, nextThing, cheapest)) {
			break;
		}
		ns.printf("Bought %s for %s", nextThing, formatMoney(cheapest));
		moneySpent += cheapest;
	}
	return moneySpent;
}

/** @param {NS} ns */
function upgradeThing(ns, which, cost) {
	if (costForThing(ns, which) != cost) {
		return false;
	}
	switch (which) {
		case "node":
			return ns.hacknet.purchaseNode() != -1;
		case "level":
			return buyThing(ns, cost, ns.hacknet.getLevelUpgradeCost, ns.hacknet.upgradeLevel);
		case "ram":
			return buyThing(ns, cost, ns.hacknet.getRamUpgradeCost, ns.hacknet.upgradeRam);
		case "core":
			return buyThing(ns, cost, ns.hacknet.getCoreUpgradeCost, ns.hacknet.upgradeCore);
		case "cache":
			return buyThing(ns, cost, ns.hacknet.getCacheUpgradeCost, ns.hacknet.upgradeCache);
	}
	return false;
}

/** @param {NS} ns */
function buyThing(ns, cost, costFunc, upgradeFunc) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		if (costFunc(ii) == cost) {
			return upgradeFunc(ii);
		}
	}
	return false;
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
		case "core":
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