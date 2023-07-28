import { getDatabase, getAvailableMoney, getAugmentationsToPurchase, filterExpensiveAugmentations } from "helpers.js";
import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	// ns.printf("Bladeburner action: %s", JSON.stringify(ns.bladeburner.getCurrentAction()));
	const actionDb = JSON.parse(ns.read("actiondb.txt"));
	const currentCity = actionDb.current;
	if (switchToAction(ns, getAction(actionDb, "General", "Diplomacy"),
		ns.bladeburner.getCityChaos(currentCity) > 50)) {
		return;
	}
	// ns.tprintf("Bladeburner action: %s", JSON.stringify(ns.bladeburner.getCurrentAction()));

	var bestDelta = 1;
	var worstDelta = 0;
	for (var action of actionDb.actions) {
		var delta = action.chances[1] - action.chances[0];
		if (delta < bestDelta) {
			bestDelta = delta;
		}
		if (delta > worstDelta) {
			worstDelta = delta;
		}
	}
	// ns.tprintf("Bladeburner action: %s", JSON.stringify(ns.bladeburner.getCurrentAction()));
	if (switchToAction(ns, getAction(actionDb, "General", "Field Analysis"),
		bestDelta > 0.1 || worstDelta > 0.4)) {
		//ns.tprintf("Field analysis");
		return;
	}

	// ns.tprintf("Bladeburner action: %s", JSON.stringify(ns.bladeburner.getCurrentAction()));
	const [current, max] = ns.bladeburner.getStamina();
	const nextAction = selectAction(ns, actionDb);
	if (switchToAction(ns, getAction(actionDb, "General", "Training"),
		current < 0.7 * max || (nextAction.type == "General" && nextAction.name == "Training"))) {
		//ns.tprintf("Training");
		return;
	}

	// ns.tprintf("Bladeburner action: %s", JSON.stringify(ns.bladeburner.getCurrentAction()));
	if (switchToAction(ns, nextAction, true)) {
		//ns.tprintf("Action");
		return;
	}
}

/** @param {NS} ns */
function switchToAction(ns, action, condition) {
	const previousAction = ns.bladeburner.getCurrentAction();
	if (previousAction.type == "BlackOp") {
		return true;
	}
	if (condition) {
		if (previousAction.type != action.type || previousAction.name != action.name) {
			// ns.tprintf("Old action: %s, new action: %s", JSON.stringify(previousAction), JSON.stringify(action));
			ns.bladeburner.stopBladeburnerAction();
		}
		executeAction(ns, action);
	} else if (previousAction.type == action.type && previousAction.name == action.name) {
		ns.bladeburner.stopBladeburnerAction();
	}
	return condition;
}

/** @param {NS} ns */
function needMoney(ns) {
	const database = getDatabase(ns);
	const factions = [{
		name: c.BLADEBURNERS,
		reputation: 1e99,
	}];
	const allAugs = getAugmentationsToPurchase(ns, database, factions, 1e99).length;
	if (allAugs == 0) {
		// own all augmentations but still might be poor
		return getAvailableMoney(ns) < 100e9;
	}

	factions[0].reputation = ns.singularity.getFactionRep(c.BLADEBURNERS)
	const haveRep = getAugmentationsToPurchase(ns, database, factions, 1e99).length;

	const myMoney = getAvailableMoney(ns, true);
	const enoughMoney = getAugmentationsToPurchase(ns, database, factions, myMoney);
	filterExpensiveAugmentations(ns, enoughMoney, myMoney);
	const haveMoney = enoughMoney.length;

	ns.printf("Have rep for %d augs and money for %d augs", haveRep, haveMoney);
	return haveMoney <= haveRep;
}

function getAction(actionDb, type, name) {
	return actionDb.actions.find(a => a.type == type && a.name == name);
}

/** @param {NS} ns */
function selectAction(ns, actionDb) {
	var bestAction;
	if (needMoney(ns)) {
		bestAction = selectActionDetailed(ns, actionDb, "Contract", true);
	}
	if (bestAction) return bestAction;
	bestAction = selectActionDetailed(ns, actionDb, undefined, true);
	if (bestAction) return bestAction;
	if (actionDb.cities.find(a => a.name == actionDb.current).population > 1e9) {
		bestAction = selectActionDetailed(ns, actionDb, undefined, false);
		if (bestAction) return bestAction;
	}
	ns.print("No best action found, will do field analysis");
	return getAction(actionDb, "General", "Field Analysis");
}

/** @param {NS} ns */
function selectActionDetailed(ns, actionDb, type, avoidKilling) {
	var bestAction = undefined;
	var bestExpected = 0;
	const minChance = 0.3;
	for (var action of actionDb.actions) {
		if (action.actionCountRemaining < 1) {
			ns.printf("action %s : no more remaining", JSON.stringify(action));
			continue;
		}
		if (type && action.type != type) {
			ns.printf("action %s : wrong type", JSON.stringify(action));
			continue;
		}
		if (avoidKilling && action.killing) {
			if (Math.random() > 0.1) continue;
		}
		const loopTime = ns.bladeburner.getBonusTime() > 15000 ? 150000 : 30000;
		const count = Math.min(action.actionCountRemaining * action.time, loopTime) / action.time;
		if (count * action.time < 0.5 * loopTime) {
			ns.printf("action %s : too few actions in loop", JSON.stringify(action));
			continue;
		}
		var chance = (action.chances[0] + action.chances[1]) / 2;
		if (chance >= minChance &&
			(chance * action.reputation * count > bestExpected)) {
			ns.printf("Selecting action %s", JSON.stringify(action));
			bestExpected = chance * action.reputation * count;
			bestAction = action;
		} else {
			ns.printf("action %s : not better", JSON.stringify(action));
		}
	}
	return bestAction;
}

/** @param {NS} ns */
function executeAction(ns, action) {
	var current = ns.bladeburner.getCurrentAction();
	if (current.type == action.type && current.name == action.name) {
		ns.printf("Action %s %s is already running", action.type, action.name);
		return;
	}
	if (current.type != "Idle") {
		ns.printf("Action %s %s is running, wont start %s %s",
			current.type, current.name, action.type, action.name);
		return;
	}
	ns.bladeburner.startAction(action.type, action.name);
}