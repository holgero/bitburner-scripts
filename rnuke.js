import { traverse } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("scan");
	const known = ["home"];
	const path = [];

	await traverse(ns, "home", known, path, nukeServer);
}

/** @param {NS} ns **/
async function nukeServer(ns, server, known, path) {
	if (ns.hasRootAccess(server)) {
		return;
	}
	const ports = ns.getServer(server).numOpenPortsRequired;
	const havePrograms = ns.args.length > 0 ? +ns.args[0] : 5;
	if (ports > havePrograms) {
		return;
	}
	switch (ports) {
		case 5:
			ns.sqlinject(server);
		case 4:
			ns.httpworm(server);
		case 3:
			ns.relaysmtp(server);
		case 2:
			ns.ftpcrack(server);
		case 1:
			ns.brutessh(server);
	}
	ns.tprintf("nuking %s", server);
	ns.nuke(server);
}