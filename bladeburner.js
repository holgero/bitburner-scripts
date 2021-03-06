import { runAndWait, getAvailableMoney, getAugmentationsToPurchase, filterExpensiveAugmentations } from "helpers.js";
import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const player = ns.getPlayer();
	if (player.bitNodeN != 6 && player.bitNodeN != 7) {
		ns.tprintf("Neither on bitnode 6 or 7 (%d)", player.bitNodeN);
		return;
	}
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
			var bestAction;
			if (needMoney(ns)) {
				bestAction = selectAction(ns, actionDb, "Contract");
			} else {
				bestAction = selectAction(ns, actionDb);
			}
			if (bestAction) {
				await executeAction(ns, bestAction);
			} else {
				await executeAction(ns, getAction(actionDb, "General", "Training"));
			}
		} else {
			await executeAction(ns, getAction(actionDb, "General", "Training"));
		}
		if (worstDelta > 0.1) {
			await executeAction(ns, getAction(actionDb, "General", "Field Analysis"));
		}
		while (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
			await executeAction(ns, getAction(actionDb, "General", "Diplomacy"));
		}
		await runAndWait(ns, "bbskills.js");
		await runAndWait(ns, "blackops.js");
	}
}

/** @param {NS} ns */
function needMoney(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const factions = [ { name:c.BLADEBURNERS, reputation:ns.getFactionRep(c.BLADEBURNERS)}];
	const haveRep = getAugmentationsToPurchase(ns, database, factions, 1e99).length;

	factions[0].reputation = 1e99;
	const myMoney = getAvailableMoney(ns, true);
	const enoughMoney = getAugmentationsToPurchase(ns, database, factions, myMoney);
	filterExpensiveAugmentations(ns, enoughMoney, myMoney);
	const haveMoney = enoughMoney.length;

	ns.printf("Have rep for %d augs and money for %d augs", haveRep, haveMoney);
	return haveMoney <= haveRep;
}

function getAction(actionDb, type, name) {
	return actionDb.actions.find(a=>a.type == type && a.name == name);
}

/** @param {NS} ns */
function selectAction(ns, actionDb, type) {
	var bestAction = selectActionDetailed(ns, actionDb, type, true);
	if (bestAction) return bestAction;
	bestAction = selectActionDetailed(ns, actionDb, undefined, true);
	if (bestAction) return bestAction;
	return selectActionDetailed(ns, actionDb, undefined, false);
}

/** @param {NS} ns */
function selectActionDetailed(ns, actionDb, type, avoidKilling) {
	var bestAction = undefined;
	var bestExpected = 0;
	const minChance = 0.3;
	for (var action of actionDb.actions) {
		if (action.actionCountRemaining <= 0) {
			continue;
		}
		if (type && action.type != type) {
			continue;
		}
		if (avoidKilling && action.killing) {
			if (Math.random() > 0.1) continue;
		}
		var chance = (action.chances[0] + action.chances[1]) / 2;
		if (chance >= minChance &&
			(chance * action.reputation / action.time > bestExpected)) {
			ns.printf("Selecting action %s", JSON.stringify(action));
			bestExpected = chance * action.reputation / action.time;
			bestAction = action;
		}
	}
	return bestAction;
}

/** @param {NS} ns */
async function executeAction(ns, action) {
	var current = ns.bladeburner.getCurrentAction();
	if (action.type != current.type || action.name != current.name) {
		ns.printf("Current action %s %s, changing to %s %s",
			current.type, current.name, action.type, action.name);
		ns.bladeburner.stopBladeburnerAction();
		ns.bladeburner.startAction(action.type, action.name);
	}
	var bonusTime = ns.bladeburner.getBonusTime();
	var time = action.time;
	if (time > bonusTime) {
		time = time - bonusTime;
	} else {
		time = time / 5;
	}
	await ns.sleep(time + 1000);
}
