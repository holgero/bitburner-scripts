import * as c from "constants.js";
import { runAndWait, getRestrictions } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["division", false], ["faction", false], ["for-free", true]]);
	const restrictions = getRestrictions(ns);
	if (restrictions && restrictions.nobladeburner) {
		ns.printf("Not joining blade burner");
		return;
	}
	var player = ns.getPlayer();
	if (options.division) {
		while (!ns.bladeburner.inBladeburner()) {
			await runAndWait(ns, "commit-crimes.js");
			await ns.sleep(45000);
			player = ns.getPlayer();
			var countLowSkills = 0;
			if (player.skills.strength < 100) {
				countLowSkills++;
			}
			if (player.skills.agility < 100) {
				countLowSkills++;
			}
			if (player.skills.defense < 100) {
				countLowSkills++;
			}
			if (player.skills.dexterity < 100) {
				countLowSkills++;
			}
			if (countLowSkills > 0) {
				await runAndWait(ns, "spend-hashes.js", "--gym");
				const delay = 90000 / countLowSkills;
				if (player.skills.strength < 100) {
					await workout(ns, "Strength");
					await ns.sleep(delay);
				}
				if (player.skills.agility < 100) {
					await workout(ns, "Agility");
					await ns.sleep(delay);
				}
				if (player.skills.defense < 100) {
					await workout(ns, "Defense");
					await ns.sleep(delay);
				}
				if (player.skills.dexterity < 100) {
					await workout(ns, "Dexterity");
					await ns.sleep(delay);
				}
			}
			if (ns.bladeburner.joinBladeburnerDivision()) {
				ns.tprintf("Joined Bladeburners division");
				ns.singularity.stopAction();
				break;
			}
		}
	}
	if (options["for-free"]) {
		if (!ns.bladeburner.inBladeburner()) {
			if (player.skills.strength >= 100 &&
				player.skills.agility >= 100 &&
				player.skills.defense >= 100 &&
				player.skills.dexterity >= 100) {
				if (ns.bladeburner.joinBladeburnerDivision()) {
					ns.tprintf("Joined Bladeburners division");
				}

			}
		}
	}
	player = ns.getPlayer();
	if (ns.bladeburner.inBladeburner() && options.faction) {
		if (!player.factions.includes(c.BLADEBURNERS)) {
			if (ns.bladeburner.joinBladeburnerFaction()) {
				ns.tprintf("Joined Bladeburners faction");
			}
		}
	}
}

/** @param {NS} ns */
async function workout(ns, stat) {
	await runAndWait(ns, "workout.js", stat, ns.singularity.isFocused());
}