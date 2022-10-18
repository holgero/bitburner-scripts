import { traverse } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("scan");
	const known = ["home"];
	const path = [];

	await traverse(ns, "home", known, path, runKill);
}

/** @param {NS} ns **/
async function runKill(ns, server, known, path) {
	if (!ns.hasRootAccess(server)) {
		return;
	}
	ns.killall(server, true);
}