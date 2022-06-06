const KILLING_ACTIONS = ["Bounty Hunter", "Retirement", "Raid"];

/** @param {NS} ns */
export async function main(ns) {
	const actionDb = {
		actions: [],
	};
	actionDb.actions.push(...ns.bladeburner.getGeneralActionNames().map(
		a => constructAction("General", a)));
	actionDb.actions.push(...ns.bladeburner.getContractNames().map(
		a => constructAction("Contract", a)));
	actionDb.actions.push(...ns.bladeburner.getOperationNames().map(
		a => constructAction("Operation", a)));

	// ns.tprintf("%s", JSON.stringify(actionDb));
	setActionLevels(ns, actionDb, 0.50);
	await ns.write("actiondb.txt", JSON.stringify(actionDb), "w");
}

/** @param {NS} ns */
function constructAction(type, name) {
	return {
		name: name,
		type: type,
		level: 1,
		chances: [],
		reputation: 0,
		killing: KILLING_ACTIONS.includes(name),
	}
}

/** @param {NS} ns */
function setActionLevels(ns, actionDb, minChance) {
	// ns.tprintf("%s", JSON.stringify(actionDb));
	for (var action of actionDb.actions) {
		// ns.tprintf("%s", JSON.stringify(action));
		// ns.tprintf("%s %s", action.type, action.name);
		ns.bladeburner.setActionAutolevel(action.type, action.name, false);
		for (var ii = 1; ii <= ns.bladeburner.getActionMaxLevel(action.type, action.name); ii++) {
			ns.bladeburner.setActionLevel(action.type, action.name, ii);
			action.level = ii;
			action.chances = ns.bladeburner.getActionEstimatedSuccessChance(action.type, action.name);
			var chance = (action.chances[0] + action.chances[1]) / 2;
			if (chance < minChance) {
				// ns.tprintf("Level %d is enough for %s %s, chance is %s", ii, action.type, action.name, chance.toFixed(2));
				break;
			}
		}
		action.reputation = ns.bladeburner.getActionRepGain(
			action.type, action.name, action.level);
		action.time = ns.bladeburner.getActionTime(action.type, action.name);
		action.actionCountRemaining = ns.bladeburner.getActionCountRemaining(action.type, action.name);
	}
}