import { getDatabase } from "helpers.js";
const WEAKEN_SCRIPT = "do-weaken.js";
const GROW_SCRIPT = "do-grow.js";
const HACK_SCRIPT = "do-hack.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["target", "foodnstuff"],
		["hack", false],
		["spare", 46]]);

	ns.scriptKill(WEAKEN_SCRIPT, "home");
	ns.scriptKill(GROW_SCRIPT, "home");
	ns.scriptKill(HACK_SCRIPT, "home");

	if (ns.getServerMaxRam("home") -
		ns.getScriptRam("instrument.js") -
		ns.getScriptRam("nodestart.js") < options.spare) {
		return;
	}
	var availableRam = -1;
	while (availableRam < 0) {
		availableRam = ramAvailable(ns, options.spare);
		await ns.sleep(1000);
	}
	var serverData = {
		moneyMin: options.hack ? 0 : ns.getServerMaxMoney(options.target) * 0.75,
		moneyMax: options.hack ? 0 : ns.getServerMaxMoney(options.target) * 0.95,
		securityMin: 1.2 * ns.getServerMinSecurityLevel(options.target) + 1,
		securityMax: 1.4 * ns.getServerMinSecurityLevel(options.target) + 5,
		growThreads: Math.ceil(availableRam / ns.getScriptRam(GROW_SCRIPT) / 1.5),
		weakenThreads: Math.ceil(availableRam / ns.getScriptRam(WEAKEN_SCRIPT) / 1.5),
		deltaThreads: Math.ceil(availableRam / ns.getScriptRam(GROW_SCRIPT) / 5)
	};

	if (options.hack) {
		serverData.growThreads = 0;
	}
	ns.tprintf("Starting against target %s, with threads (weaken=%d, grow=%d)",
		options.target, serverData.weakenThreads, serverData.growThreads)

	while (true) {
		var availableRam = ramAvailable(ns, options.spare);
		if (availableRam < 0) return;
		var hackThreads = Math.max(0, Math.floor((availableRam
			- serverData.growThreads * ns.getScriptRam(GROW_SCRIPT)
			- serverData.weakenThreads * ns.getScriptRam(WEAKEN_SCRIPT)) /
			ns.getScriptRam(HACK_SCRIPT)));
		if (serverData.weakenThreads) ns.run(WEAKEN_SCRIPT, serverData.weakenThreads, options.target);
		if (serverData.growThreads) ns.run(GROW_SCRIPT, serverData.growThreads, options.target);
		if (hackThreads) ns.run(HACK_SCRIPT, hackThreads, options.target);
		var changed = false;
		while (!changed) {
			var sleepTime = Math.max(hackThreads ? ns.getHackTime(options.target) : 0,
				serverData.weakenThreads ? ns.getWeakenTime(options.target) : 0,
				serverData.growThreads ? ns.getGrowTime(options.target) : 0);
			await ns.sleep(Math.ceil(sleepTime));
			if (ns.getServerSecurityLevel(options.target) > serverData.securityMax) {
				serverData.weakenThreads += serverData.deltaThreads;
				changed = true;
				if (hackThreads < serverData.deltaThreads) {
					serverData.growThreads = Math.floor(
						(availableRam - serverData.weakenThreads * ns.getScriptRam(WEAKEN_SCRIPT))
						/ ns.getScriptRam(GROW_SCRIPT));
				}
			} else if (ns.getServerMoneyAvailable(options.target) < serverData.moneyMin) {
				serverData.growThreads += serverData.deltaThreads;
				changed = true;
				if (hackThreads < serverData.deltaThreads) {
					serverData.weakenThreads = Math.floor(
						(availableRam - serverData.growThreads * ns.getScriptRam(GROW_SCRIPT))
						/ ns.getScriptRam(WEAKEN_SCRIPT));
				}
			} else if (serverData.weakenThreads &&
				ns.getServerSecurityLevel(options.target) < serverData.securityMin) {
				serverData.weakenThreads -= serverData.deltaThreads;
				changed = true;
			} else if (serverData.growThreads &&
				ns.getServerMoneyAvailable(options.target) > serverData.moneyMax) {
				serverData.growThreads -= serverData.deltaThreads;
				changed = true;
			}
		}
		serverData.deltaThreads = Math.max(1, Math.floor(serverData.deltaThreads * 0.925));
		serverData.weakenThreads = Math.max(0, serverData.weakenThreads);
		serverData.growThreads = Math.max(0, serverData.growThreads);
		if (serverData.growThreads * ns.getScriptRam(GROW_SCRIPT) +
			serverData.weakenThreads * ns.getScriptRam(WEAKEN_SCRIPT) > availableRam) {
			serverData.growThreads = Math.max(0, Math.floor(
				(availableRam - serverData.weakenThreads * ns.getScriptRam(WEAKEN_SCRIPT))
				/ ns.getScriptRam(GROW_SCRIPT)));
			serverData.weakenThreads = Math.max(0, Math.floor(
				(availableRam - serverData.growThreads * ns.getScriptRam(GROW_SCRIPT))
				/ ns.getScriptRam(WEAKEN_SCRIPT)));
		}
		ns.scriptKill(WEAKEN_SCRIPT, "home");
		ns.scriptKill(GROW_SCRIPT, "home");
		ns.scriptKill(HACK_SCRIPT, "home");
	}
}

function ramAvailable(ns, spare) {
	const database = getDatabase(ns);
	var availableRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - spare;
	if (database.features.church) {
		availableRam = availableRam / 2;
	}
	if (availableRam < Math.max(ns.getScriptRam(GROW_SCRIPT), ns.getScriptRam(WEAKEN_SCRIPT), ns.getScriptRam(HACK_SCRIPT))) {
		ns.printf("Not enough ram, exiting");
		return -1;
	}
	return availableRam;
}