import {
	runAndWait,
	getDatabase,
	getFactiongoals,
	goalCompletion,
} from "helpers.js";
import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const player = ns.getPlayer();
	const database = getDatabase(ns);
	if (player.bitNodeN != 6 && player.bitNodeN != 7 && player.bitNodeN != 11 &&
		!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		ns.printf("Neither on bitnode 6, 7 or 11 (%d) and nor have the %s",
			player.bitNodeN, c.BLADE_SIMUL);
		const goals = getFactiongoals(ns).factionGoals;
		const completion = goals ? goalCompletion(ns, goals) : 0;
		if (completion < 1 || ns.singularity.isBusy()) {
			return;
		} else {
			ns.printf("But goals are currently complete");
		}
	}
	if (ns.getServerMaxRam("home") <= 32) {
		ns.printf("Need more than 32 GB ram to work properly");
		return;
	}
	if (!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		ns.printf("Need %s to work together with factiongoals", c.BLADE_SIMUL);
		ns.scriptKill("factiongoals.js", "home");
	}
	if (!player.inBladeburner) {
		ns.spawn("joinbladeburner.js", 1, "--division", "--faction");
	}
	await runAndWait(ns, "bbselectcity.js");
	await runAndWait(ns, "setactionlevels.js");
	await runAndWait(ns, "bladeaction.js");
	await runAndWait(ns, "bbskills.js");
	await runAndWait(ns, "blackops.js");
}