import { getDatabase, getHacknetProfitability } from "helpers.js";

const MAX_RAM = 8192;
/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["maxram", false]]);
	const database = getDatabase(ns);
	const scriptHost = "joesguns";
	const scriptName = "start-hacknet2.js";
	if (database.bitnodemultipliers) {
		if (database.bitnodemultipliers.HacknetNodeMoney <= 0) {
			ns.printf("No money from hacknet, not starting any hacknet nodes");
			return;
		}
	}
	var levelMultiplier;
	var coreMultiplier;
	var ramMultiplier;
	if (database.ownedSourceFiles && database.ownedSourceFiles.find(a => a.n == 9)) {
		levelMultiplier = 6.25;
		ramMultiplier = 8;
		coreMultiplier = 1.6;
	} else {
		levelMultiplier = 25;
		ramMultiplier = 4;
		coreMultiplier = 1;
	}

	if (ns.scriptRunning(scriptName, scriptHost)) {
		ns.printf("Still installing");
		return;
	}
	if (ns.scriptRunning("start-servers2.js", "home")) {
		ns.printf("Server installation running");
		return;
	}
	var maxNodes = ns.args[0];
	var maxLevel = Math.round(maxNodes * levelMultiplier);
	var maxRam = Math.round(ns.args[0] * ramMultiplier);
	if (options.maxram) {
		maxRam = MAX_RAM;
	}
	var maxCore = Math.round(ns.args[0] * coreMultiplier);

	if (getHacknetProfitability(ns) < 0.25) {
		maxNodes = Math.min(4, maxNodes);
		maxLevel = Math.min(25, maxLevel);
		maxRam = Math.min(4, maxRam);
		maxCore = Math.min(2, maxCore);
	}

	ns.scp(scriptName, scriptHost);
	ns.scp("helpers.js", scriptHost);
	ns.scp("budget.js", scriptHost);
	ns.scp("budget.txt", scriptHost);
	ns.killall(scriptHost);
	ns.exec(scriptName, scriptHost, 1, maxNodes, maxLevel, maxRam, maxCore);
}