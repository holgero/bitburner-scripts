import { traverse } from "helpers.js";

const HACK_SCRIPT = "hack-server.js";
const VICTIM = "foodnstuff";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("scan");
	const known = ["home"];
	const path = [];

	await traverse(ns, "home", known, path, runHack);
}

/** @param {NS} ns **/
async function runHack(ns, server, known, path) {
	if (!ns.hasRootAccess(server)) {
		return;
	}
	const availableRam = ns.getServer(server).maxRam - ns.getServer(server).ramUsed;
	const neededRam = ns.getScriptRam(HACK_SCRIPT);
	const threads = Math.floor(availableRam / neededRam);
	const hackingLevel = ns.getHackingLevel();
	var victim = server;
	if (ns.getServer(server).requiredHackingSkill > hackingLevel ||
		ns.getServer(server).moneyMax < 1e6) {
		victim = VICTIM;
	}
	if (threads > 0) {
		ns.scp(HACK_SCRIPT, server);
		ns.exec(HACK_SCRIPT, server, threads, victim);
	}
}