import * as c from "constants.js";
import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["division", false], ["faction", false]]);
	var player = ns.getPlayer();
	if (options.division) {
		while (!player.inBladeburner) {
			await runAndWait(ns, "commit-crimes.js");
			await ns.sleep(60000);
			player = ns.getPlayer();
			if (player.skills.strength < 100) {
				await workout(ns, "Strength");
				await ns.sleep(15000);
			}
			if (player.skills.agility < 100) {
				await workout(ns, "Agility");
				await ns.sleep(15000);
			}
			if (player.skills.defense < 100) {
				await workout(ns, "Defense");
				await ns.sleep(15000);
			}
			if (player.skills.dexterity < 100) {
				await workout(ns, "Dexterity");
				await ns.sleep(15000);
			}
			if (ns.bladeburner.joinBladeburnerDivision()) {
				ns.printf("Joined Bladeburners division");
				ns.singularity.stopAction();
				break;
			}
		}
	}
	player = ns.getPlayer();
	if (options.faction) {
		if (player.inBladeburner &&
			!player.factions.includes(c.BLADEBURNERS)) {
			if (ns.bladeburner.joinBladeburnerFaction()) {
				ns.printf("Joined Bladeburners faction");
			}
		}
	}
}

/** @param {NS} ns */
async function workout(ns, stat) {
	await runAndWait(ns, "workout.js", stat, ns.singularity.isFocused());
}