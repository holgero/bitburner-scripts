import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const player = ns.getPlayer();
	if (player.bitNodeN != 6 && player.bitNodeN != 7) {
		ns.tprintf("Neither on bitnode 6 or 7 (%d)", player.bitNodeN);
		return;
	}
	await prepareAndJoin(ns);
	await runContracts(ns);
}

async function prepareAndJoin(ns) {
	var player = ns.getPlayer();
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
}

/** @param {NS} ns */
async function workout(ns, stat) {
	await runAndWait(ns, "workout.js", stat, ns.isFocused());
}

/** @param {NS} ns */
async function runContracts(ns) {
	while (true) {
		const [current, max] = ns.bladeburner.getStamina();
		if (current > max / 2) {
			const contracts = ns.bladeburner.getContractNames();
			var bestChance = 0;
			var bestContract = "";
			for (var contract of contracts) {
				if (ns.bladeburner.getActionCountRemaining("Contract", contract) <= 0) {
					continue;
				}
				var chances = ns.bladeburner.getActionEstimatedSuccessChance("Contract", contract);
				if (chances[0] > bestChance) {
					bestChance = chances[0];
					bestContract = contract;
				}
			}
			if (bestContract) {
				var { type, name } = ns.bladeburner.getCurrentAction();
				if (type != "Contract" || name != bestContract) {
					ns.printf("Current type %s, action %s, changing to %s", type, name, bestContract);
					ns.bladeburner.stopBladeburnerAction();
					ns.bladeburner.startAction("Contract", bestContract);
				}
				await ns.sleep(ns.bladeburner.getActionTime("Contract", bestContract));
			}
		} else {
			var { type, name } = ns.bladeburner.getCurrentAction();
			if (type != "General" || name != "Training") {
				ns.printf("Current type %s, action %s, changing to Training", type, name);
				ns.bladeburner.stopBladeburnerAction();
				ns.bladeburner.startAction("General", "Training");
			}
			await ns.sleep(ns.bladeburner.getActionTime("General", "Training"));
		}
		await ns.sleep(500);
		for (var skill of ns.bladeburner.getSkillNames()) {
			if (ns.bladeburner.getSkillUpgradeCost(skill) <= ns.bladeburner.getSkillPoints()) {
				ns.tprintf("Spending %d skillpoints on %s",
					ns.bladeburner.getSkillUpgradeCost(skill), skill)
				ns.bladeburner.upgradeSkill(skill);
			}
		}
	}
}