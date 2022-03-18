import * as c from "./constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("%s", JSON.stringify(c.CITIES));
	ns.tprintf("%s", JSON.stringify(c.ALL_FACTIONS));
}