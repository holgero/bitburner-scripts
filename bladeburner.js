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
		await runAndWait(ns, "bbselectcity.js");
		await runAndWait(ns, "setactionlevels.js");
		const actionDb = JSON.parse(ns.read("actiondb.txt"));
		var worstDelta = 0;
		for (var action of actionDb.actions) {
			var delta = action.chances[1] - action.chances[0];
			if (delta > worstDelta) {
				worstDelta = delta;
			}
		}

		const [current, max] = ns.bladeburner.getStamina();
		if (current > 0.7 * max) {
			var bestAction = selectAction(ns, actionDb);
			if (bestAction) {
				await executeAction(ns, bestAction.type, bestAction.name);
			} else {
				await executeAction(ns, "General", "Training");
			}
			bestAction = selectAction(ns, actionDb, "Contract");
			if (bestAction) {
				await executeAction(ns, bestAction.type, bestAction.name);
			} else {
				await executeAction(ns, "General", "Training");
			}
		} else {
			await executeAction(ns, "General", "Training");
		}
		if (worstDelta > 0.1) {
			await executeAction(ns, "General", "Field Analysis");
		}
		while (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
			await executeAction(ns, "General", "Diplomacy");
		}
		await runAndWait(ns, "bbskills.js");
		await runAndWait(ns, "blackops.js");
	}
}

/** @param {NS} ns */
function selectAction(ns, actionDb, type) {
	var bestAction = undefined;
	var bestExpected = 0;
	const minChance = 0.3;
	for (var action of actionDb.actions) {
		if (ns.bladeburner.getActionCountRemaining(action.type, action.name) <= 0) {
			continue;
		}
		if (type && action.type != type) {
			continue;
		}
		if (action.name == "Raid") {
			if (Math.random() > 0.1) continue;
		}
		var chance = (action.chances[0] + action.chances[1]) / 2;
		if (chance >= minChance &&
			(chance * action.reputation / action.time > bestExpected)) {
			bestExpected = chance * action.reputation / action.time;
			bestAction = action;
		}
	}
	return bestAction;
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
	var time = ns.bladeburner.getActionTime(type, name);
	var bonusTime = ns.bladeburner.getBonusTime();
	if (time > bonusTime) {
		time = time - bonusTime;
	} else {
		time = time / 5 + 500;
	}
	await ns.sleep(time);
}