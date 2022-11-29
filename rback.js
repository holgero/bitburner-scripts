import { traverse, runAndWait } from "helpers.js";
import { STORY_LINE } from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("scan");
	const known = ["home"];
	const path = [];

	await traverse(ns, "home", known, path, runBack);
}

/** @param {NS} ns **/
async function runBack(ns, server, known, path) {
	if (ns.flags([["all", false]]).all || STORY_LINE.some(a => a.backdoor == server)) {
		if (!ns.hasRootAccess(server)) {
			return;
		}
		const hackingLevel = ns.getHackingLevel();
		if (ns.getServerRequiredHackingLevel(server) <= hackingLevel) {
			if (!ns.getServer(server).backdoorInstalled) {
				if (!await runAndWait(ns, "installbackdoor.js", JSON.stringify(path))) {
					ns.tprintf("connect %s;backdoor;home", path.join(";connect "))
					// ns.spawn("installbackdoor.js", 1, JSON.stringify(path));
				}
			}
		}
	}
}