import * as c from "constants.js";
import {
	getDatabase,
	getFactiongoals,
	goalCompletion,
	isEndgame,
	getCorporationInfo,
	getAvailableMoney,
	getEstimation,
	waitForDaedalus,
} from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const player = ns.getPlayer();
	const database = getDatabase(ns);
	const estimation = await getEstimation(ns, false);
	const money = getAvailableMoney(ns, true);
	const resetInfo = ns.getResetInfo();
	const completion = {
		money: money,
		augmentation: 0.66 * estimation.affordableAugmentationCount + estimation.prioritizedAugmentationCount,
		endGame: isEndgame(ns),
		canDestroyWorld: canDestroyWorld(ns, player, database),
		canAffordRedPill: canAffordRedPill(estimation),
		canAffordBladesimul: canAffordBladesimul(estimation),
		waitForDaedalus: waitForDaedalus(ns),
		goalCompletion: realGoalCompletion(ns),
		freeServer: database.features.hacknetServer && (resetInfo.lastAugReset == resetInfo.lastNodeReset),
		vetoes: [],
	};
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "GRAFTING") {
		completion.vetoes.push("grafting");
	}
	if (current != null && current.type == "COMPANY") {
		if ((100.0 * ns.singularity.getCompanyRep(current.companyName)) / 400000 > 90) {
			completion.vetoes.push("company");
		}
	}
	const corporationInfo = getCorporationInfo(ns);
	if (corporationInfo.issuedShares > 0) {
		completion.vetoes.push("shares");
	}
	if ((corporationInfo.shareSaleCooldown > 500 && corporationInfo.bonusTime <= 100000) ||
		(corporationInfo.shareSaleCooldown > 2000 && corporationInfo.bonusTime > 100000)) {
		completion.vetoes.push("cooldown");
	}
	if (resetInfo.currentNode == 8) {
		if (!ns.stock.has4SDataTIXAPI()) {
			completion.vetoes.push("4stix");
		}
		if (money <= 111e9) {
			completion.vetoes.push("bn8money");
		}
	} else {
		if (money >= 135e9 && !ns.corporation.hasCorporation()) {
			completion.vetoes.push("corporation");
		}
	}
	if (ns.bladeburner.inBladeburner()) {
		if (!player.factions.includes(c.BLADEBURNERS)) {
			completion.vetoes.push("bladeburner");
		}
	}

	ns.tprintf("%s", JSON.stringify(completion));
}

function canAffordRedPill(estimation) {
	return estimation.affordableAugmentations &&
		estimation.affordableAugmentations.some(a => a.name == c.RED_PILL);
}

function canAffordBladesimul(estimation) {
	return estimation.affordableAugmentations &&
		estimation.affordableAugmentations.some(a => a.name == c.BLADE_SIMUL);
}

/** @param {NS} ns */
function canDestroyWorld(ns, player, database) {
	if (database.owned_augmentations.includes(c.RED_PILL) &&
		ns.hasRootAccess(c.WORLD_DAEMON) &&
		player.skills.hacking >= ns.getServerRequiredHackingLevel(c.WORLD_DAEMON)) {
		return true;
	}
	// checking bladeburner black ops is really expensive in term of ram, 
	// so i'll leave it in blackops.js for now
	return false;
}

/** @param {NS} ns */
function realGoalCompletion(ns) {
	const goals = getFactiongoals(ns).factionGoals;
	return goalCompletion(ns, goals.filter(a => a.reputation));
}