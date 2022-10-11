import * as c from "constants.js";
import { getDatabase } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const database = getDatabase(ns);
	if (ns.getPlayer().bitNodeN != 13 &&
		(!database.ownedSourceFiles ||
			!database.ownedSourceFiles.find(a => a.n == 13))) {
		// ns.printf("Don't have a chance for Stanek's Gift");
		return;
	}

	ns.disableLog("sleep");
	for (var fragment of ns.stanek.activeFragments()) {
		if (fragment.type != 18) {
			await runMaxThreadsAndWait(ns, "stanek-charge.js", fragment.x, fragment.y);
		}
	}
}

/** @param {NS} ns **/
export async function runMaxThreadsAndWait(ns, script, ...args) {
	const availableRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 32;
	const threads = Math.floor(availableRam / ns.getScriptRam(script));
	if (threads > 0) {
		ns.run(script, threads, ...args);
		while (ns.scriptRunning(script, "home")) {
			await ns.sleep(100);
		}
	} else {
		await ns.sleep(1000);
	}
}