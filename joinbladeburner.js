import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	var player = ns.getPlayer();
	if (player.bitNodeN != 6 && player.bitNodeN != 7) {
		ns.tprintf("Neither on bitnode 6 or 7 (%d)", player.bitNodeN);
		return;
	}
	while (!player.inBladeburner) {
		ns.stopAction();
		await runAndWait(ns, "commit-crimes.js", "--until_stats", "100", "--timed", "120");
		player = ns.getPlayer();
		if (player.strength < 100) {
			await workout(ns, "Strength");
		}
		if (player.agility < 100) {
			await workout(ns, "Agility");
		}
		if (player.defense < 100) {
			await workout(ns, "Defense");
		}
		if (player.dexterity < 100) {
			await workout(ns, "Dexterity");
		}
		if (ns.bladeburner.joinBladeburnerDivision()) {
			break;
		}
	}
	ns.stopAction();
}

/** @param {NS} ns */
async function workout(ns, stat) {
	await runAndWait(ns, "workout.js", stat, ns.isFocused());
}