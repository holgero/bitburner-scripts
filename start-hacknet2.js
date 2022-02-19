var maxNodes = 0;
var maxLevel = 0;
var maxRam = 0;
var maxCore = 0;

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	maxNodes = ns.args[0];
	maxLevel = ns.args[1];
	maxRam = ns.args[2];
	maxCore = ns.args[3];
	ns.tprintf("starting %d nodes with level %d, %d ram and %d cores.",
		maxNodes, maxLevel, maxRam, maxCore);

	// purchase the requested number of nodes
	while (ns.hacknet.numNodes() < maxNodes) {
		await purchaseMore(ns);
	}
	while (ns.hacknet.getNodeStats(maxNodes-1).cores < maxCore) {
		await purchaseMore(ns);
	}
	while (ns.hacknet.getNodeStats(maxNodes-1).ram < maxRam) {
		await purchaseMore(ns);
	}
	while (ns.hacknet.getNodeStats(maxNodes-1).level < maxLevel) {
		await purchaseMore(ns);
	}
}

/** @param {NS} ns **/
export async function purchaseMore(ns) {
	var money = ns.getServerMoneyAvailable("home");
	// purchase a new node if we have enough money
	if (ns.hacknet.numNodes() < maxNodes) {
		if (ns.hacknet.getPurchaseNodeCost() < money) {
			ns.hacknet.purchaseNode();
			return;
		}
	}
	// try to upgrade something on the already existing nodes
	for (var ii=0; ii<ns.hacknet.numNodes() && ii < maxNodes; ii++) {
		var stats = ns.hacknet.getNodeStats(ii);
		if (stats.level < maxLevel && ns.hacknet.getLevelUpgradeCost(ii, 1) < money) {
			ns.hacknet.upgradeLevel(ii, 1);
			return;
		}
		if (stats.ram < maxRam && ns.hacknet.getRamUpgradeCost(ii, 1) < money) {
			ns.hacknet.upgradeRam(ii, 1);
			return;
		}
		if (stats.cores < maxCore && ns.hacknet.getCoreUpgradeCost(ii, 1) < money) {
			ns.hacknet.upgradeCore(ii, 1);
			return;
		}
	}
	await ns.sleep(10000);
}