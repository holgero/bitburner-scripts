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
export async function getAugmentationsToPurchase(ns, factions, haveAug, toPurchase) {
	if (!haveAug.includes(GOVERNOR)) {
		haveAug.push(GOVERNOR);
	}
	var augmentations = [];
	await addPossibleAugmentations(ns, factions, augmentations, haveAug);
	await addPossibleAugmentations(ns, factions, augmentations, haveAug);

	augmentations.sort(function (a, b) { return a.sortc - b.sortc; });
	augmentations.reverse();
	for (var augmentation of augmentations) {
		toPurchase.push(augmentation.name);
	}
}

/** @param {NS} ns **/
async function addPossibleAugmentations(ns, factions, toPurchase, haveAug) {
	for (var factionElem of factions) {
		var faction = factionElem.name;
		var reputation = Math.max(ns.getFactionRep(faction), factionElem.reputation);
		var possibleAugmentations = ns.getAugmentationsFromFaction(faction);
		for (var augmentation of possibleAugmentations) {
			if (haveAug.includes(augmentation)) {
				continue;
			}
			if (toPurchase.some(a => a.name == augmentation)) {
				continue;
			}
			var needed = ns.getAugmentationRepReq(augmentation);
			if (needed > reputation) {
				continue;
			}
			var sortc = db.xgetAugmentationPrice(ns, augmentation);
			var requiredAugs = ns.getAugmentationPrereq(augmentation);
			if (requiredAugs.length > 0) {
				var haveThem = true;
				for (var requiredAug of requiredAugs) {
					if (!haveAug.includes(requiredAug)) {
						haveThem = false;
						break;
					}
				}
				if (!haveThem) {
					if (requiredAugs.length == 1) {
						var requiredAug = requiredAugs[0];
						var reqIdx = toPurchase.findIndex(a => a.name == requiredAug);
						if (reqIdx < 0) {
							continue;
						}
						sortc = (toPurchase[reqIdx].sortc + 1.9 * sortc) / 2.9;
						updateRequiredChain(toPurchase, requiredAug, sortc);
					}
				}
			}
			toPurchase.push({ name: augmentation, sortc: sortc, required: requiredAugs });
		}
		// await ns.sleep(100);
	}
	// ns.tprintf("Augs: %s", JSON.stringify(toPurchase))
}

function updateRequiredChain(toPurchase, requiredAug, sortc) {
	toPurchase.forEach(function (a) {
		if (a.name == requiredAug) {
			a.sortc = sortc + 1;
			for (var required of a.required) {
				updateRequiredChain(toPurchase, required, sortc + 1);
			}
		}
	});
}

/** @param {NS} ns **/
export function reputationNeeded(ns, database, factionName) {
	const faction = database.factions.find(a=>a.name==factionName);
	var previousReputation = Math.pow(1.02, faction.favor - 1) * 25500 - 25000;
	var reputationNeeded = Math.pow(1.02, database.favorToDonate - 1) * 25500 - 25000;
	return Math.max(0, reputationNeeded - previousReputation);
}