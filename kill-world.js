import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	await ns.write("fini.txt", "End reached at " + new Date(), "w");
	ns.stopAction();
	ns.nuke(c.WORLD_DAEMON);
	ns.connect(c.WORLD_DAEMON);
	await ns.manualHack();
	await ns.installBackdoor();
}