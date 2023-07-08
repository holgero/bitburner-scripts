import * as c from "constants.js";
import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	var player = ns.getPlayer();
	while (!player.factions.includes(c.NITESEC)) {
		await runAndWait(ns, "spend-hashes.js", "--uni");
		await university(ns);
		await ns.sleep(50000);
		await ns.sleep(10000);
		player = ns.getPlayer();
	}
}

/** @param {NS} ns */
async function university(ns) {
	await runAndWait(ns, "university.js", "--course", "CS", "--negative", "--focus", ns.singularity.isFocused());
}