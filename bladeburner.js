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
		var bestAction = undefined;
		if (current > 0.6 * max) {
			await runAndWait(ns, "bbselectcity.js");
			await runAndWait(ns, "setactionlevels.js");
			const actionDb = JSON.parse(ns.read("actiondb.txt"));
			const minChance = 0.3;
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
		}
		if (bestAction) {
			await executeAction(ns, bestAction.type, bestAction.name);
		} else {
			await executeAction(ns, "General", "Training");
			await executeAction(ns, "General", "Field Analysis");
		}
		await ns.sleep(100);
		for (var skill of ns.bladeburner.getSkillNames()) {
			if (ns.bladeburner.getSkillUpgradeCost(skill) <= ns.bladeburner.getSkillPoints()) {
				ns.tprintf("Spending %d skillpoints on %s",
					ns.bladeburner.getSkillUpgradeCost(skill), skill)
				ns.bladeburner.upgradeSkill(skill);
			}
		}
	}
}

/** @param {NS} ns */
async function executeAction(ns, type, name) {
	var current = ns.bladeburner.getCurrentAction();
	if (type != current.type || name != current.name) {
		ns.printf("Current action %s %s, changing to %s %s",
			current.type, current.name, type, name);
		ns.bladeburner.stopBladeburnerAction();
		ns.bladeburner.startAction(type, name);
	}
	await ns.sleep(ns.bladeburner.getActionTime(type, name));
}