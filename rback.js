import { traverse, runAndWait } from "helpers.js";
import { STORY_LINE, WORLD_DAEMON } from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("scan");
	const known = ["home"];
	const path = [];

	await traverse(ns, "home", known, path, runBack);
}

/** @param {NS} ns **/
async function runBack(ns, server, known, path) {
	const options = ns.flags([["all", false], ["one", false], ["list", false]]);
	if (options.list) {
		ns.tprintf("%20s %6d %s", server, ns.getServerRequiredHackingLevel(server), ns.getServer(server).backdoorInstalled ? "*" : " ");
		return;
	}
	if (options.all || options.one || STORY_LINE.some(a => a.backdoor == server)) {
		if (!ns.hasRootAccess(server)) {
			return;
		}
		if (server == WORLD_DAEMON) {
			return;
		}
		const hackingLevel = ns.getHackingLevel();
		if (ns.getServerRequiredHackingLevel(server) <= hackingLevel) {
			if (!ns.getServer(server).backdoorInstalled) {
				if (!await runAndWait(ns, "installbackdoor.js", JSON.stringify(path))) {
					ns.tprintf("connect %s;backdoor;home", path.join(";connect "))
					// ns.spawn("installbackdoor.js", 1, JSON.stringify(path));
				}
				if (options.one) {
					// install just one backdoor at a time
					ns.exit();
				}
			}
		}
	}
}