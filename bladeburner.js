import { runAndWait, getDatabase } from "helpers.js";
import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const player = ns.getPlayer();
	const database = getDatabase(ns);
	if (!c.BLADEBURNER_NODES.includes(player.bitNodeN) &&
		!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		ns.printf("Not on a bladeburner node (%d) without the %s",
			player.bitNodeN, c.BLADE_SIMUL);
		return;
	}
	if (!ns.bladeburner.inBladeburner()) {
		if (!ns.scriptRunning("joinbladeburner.js", "home")) {
			ns.spawn("joinbladeburner.js", 1, "--division", "--faction");
		} else {
			return;
		}
	}
	if (ns.getServerMaxRam("home") <= 32) {
		ns.printf("Need more than 32 GB ram to work properly");
		ns.spawn("commit-crimes.js", 1, "--on-idle");
	}
	if (!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		ns.printf("Need %s to work together with factiongoals", c.BLADE_SIMUL);
		ns.scriptKill("factiongoals.js", "home");
	}
	const state = ns.fileExists("bb-cities.txt") ? JSON.parse(ns.read("bb-cities.txt")) : {};
	if (!state.lastExecution || Date.now() - state.lastExecution > 30000 * 100) {
		await runAndWait(ns, "bb-investigate.js");
	} else {
		await runAndWait(ns, "bbselectcity.js");
		await runAndWait(ns, "bbactions.js");
		await runAndWait(ns, "bladeaction.js");
		await runAndWait(ns, "bbskills.js");
		await runAndWait(ns, "blackops.js");
	}
}