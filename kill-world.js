import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.stopAction();
	await ns.write("fini.txt", "End reached at " + new Date(), "w");
	while (true) {
		ns.nuke(c.WORLD_DAEMON);
		ns.connect(c.WORLD_DAEMON);
		await ns.manualHack();
		await ns.installBackdoor();
		ns.run("rscan.js", 1, "nuke");
		ns.run("rscan.js", 1, "hack");
		ns.run("rscan.js", 1, "back");
		await ns.sleep(3000);
		ns.tprintf("Next try");
	}
}