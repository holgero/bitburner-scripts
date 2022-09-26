const MAX_RAM = 8192;
/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["maxram", false]]);
	const database = JSON.parse(ns.read("database.txt"));
	const scriptHost = "joesguns";
	const scriptName = "start-hacknet2.js";
	if (database.bitnodemultipliers) {
		if (database.bitnodemultipliers.HacknetNodeMoney <= 0) {
			ns.printf("No money from hacknet, not starting any hacknet nodes");
			return;
		}
	}
	if (ns.scriptRunning(scriptName, scriptHost)) {
		ns.printf("Still installing");
		return;
	}
	if (ns.scriptRunning("start-servers2.js", "home")) {
		ns.printf("Server installation running");
		return;
	}
	var maxNodes = Math.min(32, ns.args[0]);
	var maxLevel = Math.min(200, Math.round(maxNodes * 6.25));
	var maxRam = Math.min(128, Math.round(ns.args[0] * 8));
	if (options.maxram) {
		maxRam = MAX_RAM;
	}
	var maxCore = Math.min(16, Math.round(ns.args[0] * 1.5));

	await ns.scp(scriptName, scriptHost);
	await ns.scp("helpers.js", scriptHost);
	await ns.scp("budget.js", scriptHost);
	await ns.scp("budget.txt", scriptHost);
	ns.killall(scriptHost);
	ns.exec(scriptName, scriptHost, 1, maxNodes, maxLevel, maxRam, maxCore);
}