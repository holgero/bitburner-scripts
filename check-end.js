import * as c from "constants.js";
import {
	goalCompletion,
	getAvailableMoney,
	getDatabase,
	getFactiongoals,
	getCorporationInfo,
	getEstimation,
	getRestrictions,
	isEndgame,
	formatMoney,
	waitForDaedalus,
} from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["quiet", false]]);
	if (await wantToEndRun(ns)) {
		if (!options.quiet) {
			ns.tprintf("Want to end run");
		}
		ns.write("check-end.txt", JSON.stringify({ end: true }), "w");
	} else {
		if (!options.quiet) {
			ns.tprintf("It is not yet the time to end this run.");
		}
		ns.write("check-end.txt", JSON.stringify({ end: false }), "w");
	}
}

/** @param {NS} ns **/
async function wantToEndRun(ns) {
	const player = ns.getPlayer();
	const database = getDatabase(ns);
	const money = getAvailableMoney(ns, true);
	if (database.owned_augmentations.includes(c.RED_PILL) &&
		ns.hasRootAccess(c.WORLD_DAEMON) &&
		player.skills.hacking >= ns.getServerRequiredHackingLevel(c.WORLD_DAEMON)) {
		ns.printf("Ready to end the world.");
		return true;
	}
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "GRAFTING") {
		ns.print("Grafting, not ending run");
		return false;
	}
	if (current != null && current.type == "COMPANY") {
		const completion = (100.0 * ns.singularity.getCompanyRep(current.companyName)) / 400000;
		if (completion > 90) {
			ns.printf("Nearly done working for a company (%s), not ending run", completion.toFixed(1));
			return false;
		}
	}
	const corporationInfo = getCorporationInfo(ns);
	if (corporationInfo.issuedShares > 0) {
		ns.printf("Outstanding shares %d, not ending run", corporationInfo.issuedShares);
		// avoid ending while there are outstanding shares
		return false;
	}
	if (player.bitNodeN == 8) {
		if (!ns.stock.has4SDataTIXAPI()) {
			ns.printf("On bitnode 8: Not ending before having gained access to 4S data TIX API.");
			return false;
		}
		if (money <= 111e9) {
			ns.printf("On bitnode 8: Not ending before having earned at least 111 b (have: %s).",
				formatMoney(money));
			return false;
		}
	} else {
		if (money >= 135e9 && !ns.corporation.hasCorporation()) {
			const restrictions = getRestrictions(ns);
			if (!restrictions || !restrictions.nocorporation) {
				ns.printf("Not on bitnode 8 and nearly there to start a corporation (have: %s), not ending now",
					formatMoney(money));
				return false;
			}
		}
	}
	if (ns.bladeburner.inBladeburner()) {
		if (!player.factions.includes(c.BLADEBURNERS)) {
			ns.printf("Have bladeburner job, but didn't join bladeburners faction yet, not ending");
			return false;
		}
	}
	const estimation = await getEstimation(ns, false);
	if (estimation.affordableAugmentations &&
		estimation.affordableAugmentations.some(a => a.name == c.RED_PILL)) {
		ns.printf("Can obtain the red pill");
		return true;
	}
	if ((corporationInfo.shareSaleCooldown > 500 && corporationInfo.bonusTime <= 100000) ||
		(corporationInfo.shareSaleCooldown > 2000 && corporationInfo.bonusTime > 100000)) {
		ns.printf("Cooldown %d s, not ending run", corporationInfo.shareSaleCooldown / 5);
		// avoid ending while there are  shares cant be sold at the start of the next run
		return false;
	}
	if (isEndgame(ns)) {
		const goals = getFactiongoals(ns).factionGoals;
		const completion = goalCompletion(ns, goals);
		ns.printf("Endgame: completion is %d", completion.toFixed(2));
		return completion >= 1;
	}
	if ((database.features.hacknetServer ||
		player.playtimeSinceLastAug < player.playtimeSinceLastBitnode) &&
		money <= 10e9) {
		// allow to end the first run faster than with 10 b only if we don't have
		// the free hacknetserver
		ns.printf("Not ending before having earned at least 10 b (have: %s).",
			formatMoney(money));
		return false;
	}
	if (waitForDaedalus(ns)) {
		ns.printf("Have %d augs, hacking %d, money %s: Not ending before having joined Daedalus.",
			database.owned_augmentations.length,
			player.skills.hacking,
			formatMoney(money));
		return false;
	}
	if (0.66 * estimation.affordableAugmentationCount +
		estimation.prioritizedAugmentationCount >= 10) {
		ns.printf("Enough augmentations available: affordable: %d, prioritized: %d",
			estimation.affordableAugmentationCount,
			estimation.prioritizedAugmentationCount);
		return true;
	} else {
		ns.printf("Current augmentation score is %d, (prio: %d, all: %d)",
			0.66 * estimation.affordableAugmentationCount + estimation.prioritizedAugmentationCount,
			estimation.prioritizedAugmentationCount, estimation.affordableAugmentationCount);
	}
	if (estimation.affordableAugmentationCount > 0 &&
		estimation.affordableAugmentationCount >= database.augmentations.length) {
		ns.printf("Obtaining the last augmentations");
		return true;
	}
	if (estimation.affordableAugmentations &&
		estimation.affordableAugmentations.some(a => a.name == c.BLADE_SIMUL)) {
		ns.printf("Can obtain the blades simulacrum");
		return true;
	}
	if (estimation.prioritizedAugmentationCount > 0 &&
		player.playtimeSinceLastAug > 40 * 60 * 60 * 1000) {
		ns.printf("Running for over 40 h since last aug");
		return true;
	}
	ns.printf("No reason to end this run");
	return false;
}