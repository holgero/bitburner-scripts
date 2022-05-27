/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	const maxNodes = ns.args[0];
	const maxLevel = ns.args[1];
	const maxRam = ns.args[2];
	const maxCore = ns.args[3];
	if (needMoreStuff(ns, maxNodes, maxLevel, maxRam, maxCore)) {
		ns.tprintf("starting %d nodes with level %d, %d ram and %d cores.",
			maxNodes, maxLevel, maxRam, maxCore);
	}

	while (needMoreStuff(ns, maxNodes, maxLevel, maxRam, maxCore)) {
		purchaseMoreNodes(ns, maxNodes);
		purchaseMoreLevels(ns, maxLevel);
		purchaseMoreRam(ns, maxRam);
		purchaseMoreCores(ns, maxCore);
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
function needMoreStuff(ns, maxNodes, maxLevel, maxRam, maxCore) {
	if (ns.hacknet.numNodes() < maxNodes) return true;
	for (var ii = 0; ii < maxNodes; ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.cores < maxCore) return true;
		if (stats.ram < maxRam) return true;
		if (stats.level < maxLevel) return true;
	}
	return false;
}

/** @param {NS} ns **/
function purchaseMoreNodes(ns, maxNodes) {
	if (ns.hacknet.numNodes() < maxNodes) {
		if (ns.hacknet.getPurchaseNodeCost() <
			ns.getServerMoneyAvailable("home")) {
			ns.hacknet.purchaseNode();
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreLevels(ns, maxLevel) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.level < maxLevel && ns.hacknet.getLevelUpgradeCost(ii, 1) <
			ns.getServerMoneyAvailable("home")) {
			ns.hacknet.upgradeLevel(ii, 1);
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreRam(ns, maxRam) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.ram < maxRam && ns.hacknet.getRamUpgradeCost(ii, 1) <
			ns.getServerMoneyAvailable("home")) {
			ns.hacknet.upgradeRam(ii, 1);
		}
	}
}

/** @param {NS} ns **/
function purchaseMoreCores(ns, maxCores) {
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.cores < maxCores && ns.hacknet.getCoreUpgradeCost(ii, 1) <
			ns.getServerMoneyAvailable("home")) {
			ns.hacknet.upgradeCore(ii, 1);
		}
	}
}