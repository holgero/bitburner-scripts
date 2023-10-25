import { getAvailableMoney } from "/helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");

	const maxNodes = Math.min(ns.hacknet.maxNumNodes(), ns.args[0]);
	const maxLevel = Math.min(200, ns.args[1]);
	const maxRam = Math.min(8192, ns.args[2]);
	const maxCore = ns.args[3];
	const maxCache = Math.max(0, maxNodes - 5);
	if (needMoreStuff(ns, maxNodes, maxLevel, maxRam, maxCore, maxCache)) {
		ns.tprintf("starting %d nodes with level %d, %d ram, %d cores, %d cache.",
			maxNodes, maxLevel, maxRam, maxCore, maxCache);
	}

	while (needMoreStuff(ns, maxNodes, maxLevel, maxRam, maxCore, maxCache)) {
		while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money")) {
			ns.hacknet.spendHashes("Sell for Money");
		}
		purchaseMoreNodes(ns, maxNodes);
		purchaseMoreLevels(ns, maxLevel);
		purchaseMoreRam(ns, maxRam);
		purchaseMoreCores(ns, maxCore);
		purchaseMoreCache(ns, maxCache);
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
function needMoreStuff(ns, maxNodes, maxLevel, maxRam, maxCore, maxCache) {
	if (ns.hacknet.numNodes() < maxNodes) return true;
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.cores < maxCore) return true;
		if (stats.ram < maxRam) return true;
		if (stats.level < maxLevel) return true;
		if (stats.cache < maxCache) return true;
	}
	return false;
}

/** @param {NS} ns **/
function purchaseMoreNodes(ns, maxNodes) {
	if (ns.hacknet.numNodes() < maxNodes) {
		if (ns.hacknet.getPurchaseNodeCost() <
			getAvailableMoney(ns)) {
			ns.printf("starting a new node");
			ns.hacknet.purchaseNode();
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreLevels(ns, maxLevel) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.level < maxLevel &&
			ns.hacknet.getLevelUpgradeCost(ii, 1) < getAvailableMoney(ns)) {
			ns.printf("increase level of node %d", ii);
			ns.hacknet.upgradeLevel(ii, 1);
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreRam(ns, maxRam) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.ram < maxRam &&
			ns.hacknet.getRamUpgradeCost(ii, 1) < getAvailableMoney(ns)) {
			ns.printf("install ram on node %d", ii);
			ns.hacknet.upgradeRam(ii, 1);
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreCores(ns, maxCores) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.cores < maxCores &&
			ns.hacknet.getCoreUpgradeCost(ii, 1) < getAvailableMoney(ns)) {
			ns.printf("install core on node %d", ii);
			ns.hacknet.upgradeCore(ii, 1);
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreCache(ns, maxCache) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.cache < maxCache &&
			ns.hacknet.getCacheUpgradeCost(ii, 1) < getAvailableMoney(ns)) {
			ns.printf("install cache on node %d", ii);
			ns.hacknet.upgradeCache(ii, 1);
		}
	}
}