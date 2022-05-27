import { GOVERNOR } from "/constants.js";
import * as db from "/database.js";

/** @param {NS} ns **/
export function formatMoney(amount) {
	const suffix = [" ", "k", "m", "b", "t", "q", "Q"];
	var sign = " ";
	if (amount < 0) {
		sign = "-";
		amount = - amount;
	}
	var magnitude = Math.min(suffix.length - 1, Math.floor(Math.log10(amount) / 3));
	if (amount == 0) {
		magnitude = 0;
	}
	return sign + (amount / Math.pow(10, 3 * magnitude)).toFixed(3) + " " + suffix[magnitude];
}

/** @param {NS} ns **/
export function statsGainFactor(ns) {
	var player = ns.getPlayer();
	var stats_mult = Math.min(
		player.strength_mult,
		player.defense_mult,
		player.dexterity_mult,
		player.agility_mult);
	var stats_exp_mult = Math.min(
		player.strength_exp_mult,
		player.defense_exp_mult,
		player.dexterity_exp_mult,
		player.agility_exp_mult);
	return stats_mult * stats_exp_mult;
}

/** @param {NS} ns **/
export async function runAndWait(ns, script, ...args) {
	ns.run(script, 1, ...args);
	while (ns.scriptRunning(script, "home")) {
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
export function getAugmentationsToPurchase(ns, database, factionGoals) {
	var toPurchase = [];
	for (var goal of factionGoals) {
		var faction = database.factions.find(a => a.name == goal.name);
		for (var augName of faction.augmentations) {
			var augmentation = database.augmentations.find(a => a.name == augName);
			var rep = Math.max(goal.reputation, ns.getFactionRep(goal.name));
			if (augmentation.reputation <= rep) {
				if (!toPurchase.includes(augmentation)) {
					toPurchase.push(augmentation);
					// ns.tprintf("Aug(%s): %s", goal.name, augName);
				}
			}
		}
	}
	const possibleRequirements = database.owned_augmentations.slice(0);
	possibleRequirements.push(...(toPurchase.map(a => a.name)));
	toPurchase = toPurchase.filter(a => a.requirements.every(r => possibleRequirements.includes(r)));
	for (var aug of toPurchase) {
		if (aug.sortc == undefined) {
			aug.sortc = aug.price;
		}
		if (aug.requirements.length) {
			var requirement = toPurchase.find(a => a.name == aug.requirements[0]);
			if (!requirement) {
				continue;
			}
			var sortc = (1.9 * aug.price + requirement.price) / 2.9;
			aug.sortc = sortc;
			requirement.sortc = sortc + 1;
		}
	}
	toPurchase.sort((a, b) => a.sortc - b.sortc).reverse();
	return toPurchase;
}

/** @param {NS} ns **/
export function reputationNeeded(ns, database, factionName) {
	const faction = database.factions.find(a => a.name == factionName);
	var previousReputation = Math.pow(1.02, faction.favor - 1) * 25500 - 25000;
	var reputationNeeded = Math.pow(1.02, database.favorToDonate - 1) * 25500 - 25000;
	return Math.max(0, reputationNeeded - previousReputation);
}


/** @param {NS} ns **/
export function goalCompletion(ns, factionGoals) {
	var totalRep = 0;
	var repNeeded = 0;
	for (var goal of factionGoals) {
		if (goal.reputation) {
			totalRep += goal.reputation;
			repNeeded += Math.max(0, goal.reputation - ns.getFactionRep(goal.name));
		}
	}

	if (totalRep) {
		return 1 - repNeeded / totalRep;
	}
	return 1;
}

/** @param {NS} ns **/
export function filterExpensiveAugmentations(ns, toPurchase, moneyToSpend) {
	var factor = 1.0;
	for (var ii = 0; ii < toPurchase.length; ii++) {
		var augmentation = toPurchase[ii];
		var toPay = factor * augmentation.price;
		if (toPay > moneyToSpend) {
			toPurchase.splice(ii, 1);
			ii--;
			continue;
		}
		moneyToSpend -= toPay;
		factor = factor * 1.9;
	}
	toPurchase.sort((a, b) => a.sortc - b.sortc).reverse();
}