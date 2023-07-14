import * as c from "constants.js";
import {
	goalCompletion,
	getAvailableMoney,
	getDatabase,
	getFactiongoals,
	getCorporationInfo,
	getEstimation,
	isEndgame,
	formatMoney,
} from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["started", Date.now()], ["quiet", false]]);
	if (await wantToEndRun(ns, options.started)) {
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
async function wantToEndRun(ns, started) {
	const player = ns.getPlayer();
	const database = getDatabase(ns);
	const money = getAvailableMoney(ns, true);
	if (new Date() - started < 120000) {
		ns.printf("Not ending directly after start (grace: %d s)",
			(120000 + started - new Date()) / 1000);
		return false;
	}
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
	if (corporationInfo.issuedShares > 0 ||
		(corporationInfo.shareSaleCooldown > 500 && corporationInfo.bonusTime <= 100000) ||
		(corporationInfo.shareSaleCooldown > 2000 && corporationInfo.bonusTime > 100000)) {
		ns.printf("Outstanding shares %d, cooldown %d s, not ending run",
			corporationInfo.issuedShares, corporationInfo.shareSaleCooldown / 5);
		// avoid ending while there are outstanding shares or
		// shares cant be sold at the start of the next run
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
			ns.printf("Not on bitnode 8 and nearly there to start a corporation (have: %s), not ending now",
				formatMoney(money));
			return false;
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
	if (isEndgame(ns)) {
		const goals = getFactiongoals(ns).factionGoals;
		const completion = goalCompletion(ns, goals);
		ns.printf("Endgame: completion is %d", completion.toFixed(2));
		return completion >= 1;
	}
	if (database.features.hacknetServer &&
		player.playtimeSinceLastAug == player.playtimeSinceLastBitnode &&
		money <= 10e9) {
		ns.printf("Have a hacknet server: Not ending before having earned at least 10 b (have: %s).",
			formatMoney(money));
		return false;
	}
	if (database.owned_augmentations.length >= database.bitnodemultipliers.DaedalusAugsRequirement &&
		player.skills.hacking >= 2500 &&
		money <= 120e9) {
		ns.printf("Have %d augs and hacking above 2500: Not ending before having earned at least 120 b (have: %s).",
			database.owned_augmentations.length,
			formatMoney(money));
		return false;
	}
	if ((estimation.affordableAugmentationCount +
		estimation.prioritizedAugmentationCount) / 2 >= 6) {
		ns.printf("Enough augmentations available: affordable: %d, prioritized: %d",
			estimation.affordableAugmentationCount,
			estimation.prioritizedAugmentationCount);
		return true;
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
	if (new Date() - started > 24 * 60 * 60 * 1000) {
		ns.printf("Running for over a day");
		return true;
	}
	ns.printf("No reason to end this run");
	return false;
}