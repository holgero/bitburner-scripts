import { runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const player = ns.getPlayer();
	if (player.bitNodeN != 6 && player.bitNodeN != 7) {
		ns.tprintf("Neither on bitnode 6 or 7 (%d)", player.bitNodeN);
		return;
	}
	await runAndWait(ns, "joinbladeburner.js");
	await runActions(ns);
}

/** @param {NS} ns */
async function runActions(ns) {
	while (true) {
		const [current, max] = ns.bladeburner.getStamina();
		if (current > max / 2) {
			await runAndWait(ns, "setactionlevels.js");
			const actionDb = JSON.parse(ns.read("actiondb.txt"));
			const minChance = 0.25;
			var bestExpected = 0;
			var bestAction;
			for (var action of actionDb.actions) {
				if (ns.bladeburner.getActionCountRemaining(action.type, action.name) <= 0) {
					continue;
				}
				var chance = (action.chances[0] + action.chances[1]) / 2;
				if (chance >= minChance &&
					(chance * action.reputation / action.time > bestExpected)) {
					bestExpected = chance * action.reputation / action.time;
					bestAction = action;
				}
			}
			if (bestAction) {
				var { type, name } = ns.bladeburner.getCurrentAction();
				if (type != bestAction.type || name != bestAction.name) {
					ns.printf("Current %s %s, changing to %s %s", type, name, bestAction.type, bestAction.name);
					ns.bladeburner.stopBladeburnerAction();
					ns.bladeburner.startAction(bestAction.type, bestAction.name);
				}
				await ns.sleep(bestAction.time);
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