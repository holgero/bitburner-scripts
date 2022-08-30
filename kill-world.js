import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.singularity.stopAction();
	await ns.write("fini.txt", "End reached at " + new Date(), "w");
	while (true) {
		ns.nuke(c.WORLD_DAEMON);
		ns.singularity.connect(c.WORLD_DAEMON);
		await ns.singularity.manualHack();
		await ns.singularity.installBackdoor();
		ns.run("rscan.js", 1, "back");
		await ns.sleep(30000);
		ns.tprintf("Next try");
		ns.run("rscan.js", 1, "nuke");
		ns.run("rscan.js", 1, "hack");
	}
}