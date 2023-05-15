import * as c from "constants.js";
import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	var player = ns.getPlayer();
	while (!player.factions.includes(c.COVENANT)) {
		player = ns.getPlayer();
		var lowSkill = 850;
		var skillToTrain = "";
		if (player.skills.strength < lowSkill) {
			lowSkill = player.skills.strength;
			skillToTrain = "Strength";
		}
		if (player.skills.agility < lowSkill) {
			lowSkill = player.skills.agility;
			skillToTrain = "Agility";
		}
		if (player.skills.defense < lowSkill) {
			lowSkill = player.skills.defense;
			skillToTrain = "Defense";
		}
		if (player.skills.dexterity < lowSkill) {
			lowSkill = player.skills.dexterity;
			skillToTrain = "Dexterity";
		}
		if (skillToTrain != "") {
			await runAndWait(ns, "spend-hashes.js", "--gym");
			await workout(ns, skillToTrain);
			await ns.sleep(50000);
		}
		await ns.sleep(10000);
	}
}

/** @param {NS} ns */
async function workout(ns, stat) {
	await runAndWait(ns, "workout.js", stat, ns.singularity.isFocused());
}