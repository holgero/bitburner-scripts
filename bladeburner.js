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
		var bestAction = undefined;
		if (current > 0.6 * max) {
			var bestExpected = 0;
			var bestAction;
			var minChance = 0.3;
			for (var action of actionDb.actions) {
				if (ns.bladeburner.getActionCountRemaining(action.type, action.name) <= 0) {
					continue;
				}
				switch (action.type) {
					case "Contract": minChance = 0.3;
						break;
					case "Operation": minChance = 0.45;
						break;
				}
				var chance = (action.chances[0] + action.chances[1]) / 2;
				if (chance >= minChance &&
					((chance - minChance) * action.reputation / action.time > bestExpected)) {
					bestExpected = chance * action.reputation / action.time;
					bestAction = action;
				}
			}
		}
		if (bestAction) {
			await executeAction(ns, bestAction.type, bestAction.name);
		} else {
			await executeAction(ns, "General", "Training");
			if (worstDelta > 0.1) {
				await executeAction(ns, "General", "Field Analysis");
			}
			if (ns.bladeburner.getCityChaos(ns.bladeburner.getCity()) > 50) {
				await executeAction(ns, "General", "Diplomacy");
			}
		}
		await ns.sleep(100);
		await runAndWait(ns, "bbskills.js");
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