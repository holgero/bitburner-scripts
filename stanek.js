import * as c from "constants.js";
import { getDatabase, getRestrictions } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const restrictions = getRestrictions(ns);
	if (restrictions && restrictions.nostanek) {
		return;
	}
	const database = getDatabase(ns);
	if (!database.features.church) {
		return;
	}

	ns.disableLog("sleep");
	try {
		if (ns.stanek.activeFragments().length) {
			ns.printf("Stanek installed.");
		}
	} catch (error) {
		ns.printf("%s", JSON.stringify(error));
		ns.stanek.acceptGift();
		return;
	}
	while (true) {
		if (!ns.stanek.activeFragments().length) {
			ns.printf("Stanek empty.");
			return;
		}
		for (var fragment of ns.stanek.activeFragments()) {
			if (fragment.type != 18) {
				await runMaxThreadsAndWait(ns, "stanek-charge.js", fragment.x, fragment.y);
			}
		}
	}
}

/** @param {NS} ns **/
export async function runMaxThreadsAndWait(ns, script, ...args) {
	const availableRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 32;
	const threads = Math.floor((availableRam / 2) / ns.getScriptRam(script));
	if (threads > 0) {
		ns.run(script, threads, ...args);
		while (ns.scriptRunning(script, "home")) {
			await ns.sleep(100);
		}
	} else {
		await ns.sleep(1000);
	}
}