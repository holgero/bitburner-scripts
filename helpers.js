import { GOVERNOR } from "./constants.js";

/** @param {NS} ns **/
export function formatMoney(amount) {
	var sign = " ";
	if (amount < 0) {
		sign = "-";
		amount = - amount;
	}
	if (amount > 1000) {
		if (amount > 1000000) {
			if (amount > 1000000000) {
				if (amount > 1000000000000) {
					return sign + (amount / 1000000000000).toFixed(3) + " t";
				}
				return sign + (amount / 1000000000).toFixed(3) + " b";
			}
			return sign + (amount / 1000000).toFixed(3) + " m";
		}
		return sign + (amount / 1000).toFixed(3) + " k";
	}
	return sign + amount.toFixed(3) + "  ";
}

/** @param {NS} ns **/
export async function getAugmentationsToPurchase(ns, factions, toPurchase) {
	var haveAug = ns.getOwnedAugmentations(true);
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
		var reputation = factionElem.reputation;
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
			var sortc = ns.getAugmentationPrice(augmentation);
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