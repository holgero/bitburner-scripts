import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.nuke(c.WORLD_DAEMON);
	ns.connect(c.WORLD_DAEMON);
	await ns.manualHack();
	await ns.installBackdoor();
}