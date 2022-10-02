import * as c from "constants.js";
import {
	runAndWait,
	goalCompletion,
	getAvailableMoney,
	getStartState,
	getDatabase,
	getFactiongoals,
	getCorporationInfo,
	getEstimation
} from "helpers.js";
import { reserveBudget } from "budget.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("Start at %s", new Date());
	await killOthers(ns);
	ns.disableLog("sleep");
	ns.disableLog("getServerMaxRam");

	if (getStartState(ns) != "restart") {
		await runAndWait(ns, "clean-files.js");
		await runAndWait(ns, "create-database.js");
		// hacky: create preliminary empty factiongoals
		await runAndWait(ns, "calculate-goals.js", "--money", 1);
		ns.write("allowed.txt", JSON.stringify({
			work: true,
			travel: true,
			graft: false
		}), "w");
		await startHacking(ns, getProgramCount(ns));
	}

	await setUpForCorporations(ns);

	await progressHackingLevels(ns);

	await killOthers(ns);
	await runAndWait(ns, "spend-hashes.js", "--all");
	if (getDatabase(ns).owned_augmentations.includes(c.RED_PILL)) {
		runAndWait("destroy-world.js");
	}
	await runAndWait(ns, "plan-augmentations.js", "--run_purchase");
}

async function killOthers(ns) {
	ns.scriptKill("instrument.js", "home");
	ns.scriptKill("factiongoals.js", "home");
	ns.scriptKill("joinbladeburner.js", "home");
	ns.scriptKill("bladeburner.js", "home");
	ns.scriptKill("corporation.js", "home");
	ns.scriptKill("do-weaken.js", "home");
	ns.scriptKill("do-hack.js", "home");
	ns.scriptKill("do-grow.js", "home");
	await stopTrader(ns);
}

async function setUpForCorporations(ns) {
	if (ns.getPlayer().bitNodeN == 8) {
		return;
	}
	if ((ns.getPlayer().hasCorporation || getAvailableMoney(ns, true) > 150e9) &&
		!ns.scriptRunning("corporation.js", "home")) {
		await runAndWait(ns, "purchase-ram.js", "--goal", 2048);
		if (ns.getServerMaxRam("home") >= 2048) {
			if (ns.getPlayer().hasCorporation || getAvailableMoney(ns, true) > 150e9) {
				await killOthers(ns);
				ns.run("corporation.js");
				return;
			}
		}
	}
}

/** @param {NS} ns **/
async function startTrader(ns) {
	if (!ns.scriptRunning("trader.js", "home") && ns.stock.hasTIXAPIAccess()) {
		var money = Math.min(100e9, getAvailableMoney(ns) - 10e6);
		await reserveBudget(ns, "stocks", money);
		ns.run("trader.js");
	}
}

/** @param {NS} ns **/
async function stopTrader(ns) {
	if (ns.scriptRunning("trader.js", "home")) {
		ns.scriptKill("trader.js", "home");
	}
	if (ns.stock.hasTIXAPIAccess()) {
		await runAndWait(ns, "sell-all-stocks.js");
	}
}

/** @param {NS} ns **/
async function runHomeScripts(ns) {
	ns.print("Run home scripts");
	if (ns.getPlayer().bitNodeN == 8 ||
		(ns.getServerMaxRam("home") > 32 && getAvailableMoney(ns, true) > 1e9)) {
		await startTrader(ns);
	}
	await ns.sleep(1000);
	startHomeScript(ns, "bladeburner.js");
	await ns.sleep(1000);
	if (ns.getServerMaxRam("home") > 1024 && ns.getPlayer().hasCorporation) {
		startHomeScript(ns, "joinbladeburner.js", "--division", "--faction");
	}
	await ns.sleep(1000);
	startHomeScript(ns, "factiongoals.js");
	await ns.sleep(1000);
	startHomeScript(ns, "sleeves.js");
	await ns.sleep(1000);
	startHomeScript(ns, "gangs.js");
	await ns.sleep(1000);
	startHomeScript(ns, "instrument.js");
}

/** @param {NS} ns **/
function startHomeScript(ns, scriptName, ...args) {
	if (!ns.scriptRunning(scriptName, "home")) {
		ns.run(scriptName, 1, ...args);
	}
}

/** @param {NS} ns **/
function isEndgame(ns) {
	if (!ns.getPlayer().factions.includes(c.DAEDALUS)) {
		return false;
	}
	const goals = getFactiongoals(ns);
	if (goals.factionGoals) {
		const daedalusGoal = goals.factionGoals.find(a => a.name == c.DAEDALUS);
		if (daedalusGoal && daedalusGoal.reputation > 0) {
			return true;
		}
	}
	return false;
}

/** @param {NS} ns **/
async function canSpendMoney(ns) {
	if (await wantToEndRun(ns)) {
		return false;
	}
	if (getAvailableMoney(ns) > 1e15) {
		// there's plenty
		return true;
	}
	const corporationInfo = getCorporationInfo(ns);
	if (corporationInfo.issuedShares > 0) {
		return false;
	}
	if (isEndgame(ns)) {
		return false;
	}
	const estimation = await getEstimation(ns, false);
	if (estimation.affordableAugmentationCount < 5) {
		return true;
	}
	if (estimation.estimatedPrice > getAvailableMoney(ns, true)) {
		// money is scarce
		return false;
	}
	return true;
}

/** @param {NS} ns **/
async function progressHackingLevels(ns) {
	await runAndWait(ns, "start-hacknet.js", 1);
	var lastHackingLevelRun = 0;
	while (true) {
		await runHomeScripts(ns);
		const nextProgram = getProgramCount(ns);
		if (nextProgram > lastHackingLevelRun) {
			await startHacking(ns, nextProgram);
			lastHackingLevelRun = nextProgram;
		}
		await purchaseHackingPrograms(ns, nextProgram);
		if (await wantToEndRun(ns)) {
			return;
		}
		if (await canSpendMoney(ns)) {
			await improveInfrastructure(ns, nextProgram);
		} else {
			ns.scriptKill("start-hacknet.js", "home");
			ns.scriptKill("start-hacknet2.js", "joesguns");
		}
		await runAndWait(ns, "solve_contract.js", "--auto");
		if (!ns.scriptRunning("joinbladeburner.js", "home")) {
			await runAndWait(ns, "joinbladeburner.js", "--faction");
			await runAndWait(ns, "spend-hashes.js");
		}
		await runAndWait(ns, "joinfactions.js");
		await setUpForCorporations(ns);
		await travelToGoalLocations(ns);
		await runInstallBackdoor(ns);
		await ns.sleep(30000);
	}
}

/** @param {NS} ns **/
async function wantToEndRun(ns) {
	if (ns.getPlayer().hasCorporation) {
		// avoid ending while there are outstanding shares or
		// shares cant be sold at the start of the next run
		const corporationInfo = getCorporationInfo(ns);
		if (corporationInfo.issuedShares > 0 || corporationInfo.shareSaleCooldown > 0) {
			return false;
		}
		if (corporationInfo.sharePrice < 1e3) {
			return false;
		}
	}
	if (isEndgame(ns)) {
		const goals = getFactiongoals(ns).factionGoals;
		const completion = goalCompletion(ns, goals);
		return completion >= 1;
	}
	const database = getDatabase(ns);
	const factor = database.bitnodemultipliers ?
		database.bitnodemultipliers.AugmentationMoneyCost /
		database.bitnodemultipliers.AugmentationRepCost : 1.0;
	const minMoney = Math.max(5, Math.floor(2 * Math.sqrt(database.owned_augmentations.length)))
		* 10e9 * factor;
	const estimation = await getEstimation(ns, false);
	if (estimation.estimatedPrice > Math.max(minMoney, getAvailableMoney(ns, true))) {
		return true;
	}
	if (estimation.affordableAugmentationCount > 11) {
		return true;
	}
	return false;
}

/** @param {NS} ns **/
function getProgramCount(ns) {
	var programs = 0;
	while (programs < c.programs.length && ns.fileExists(c.programs[programs].name)) {
		programs++;
	}
	return programs;
}

/** @param {NS} ns **/
async function purchaseHackingPrograms(ns, nextProgram) {
	if (nextProgram == 0 && getAvailableMoney(ns) > c.programs[0].cost + 200000) {
		await runAndWait(ns, "writeprogram.js", nextProgram++);
	}
	if (nextProgram > 0 &&
		nextProgram < c.programs.length &&
		getAvailableMoney(ns) > c.programs[nextProgram].cost) {
		while (nextProgram < c.programs.length && getAvailableMoney(ns) > c.programs[nextProgram].cost) {
			await runAndWait(ns, "writeprogram.js", nextProgram++);
		}
	}
}

/** @param {NS} ns **/
async function improveInfrastructure(ns, programsOwned) {
	await runAndWait(ns, "start-hacknet.js", programsOwned);

	switch (programsOwned) {
		case 3:
			if (ns.getServerMaxRam("home") < 64) {
				await runAndWait(ns, "purchase-ram.js", "--goal", 64);
			}
			break;
		case 4:
			if (ns.getServerMaxRam("home") < 128) {
				await runAndWait(ns, "purchase-ram.js", "--goal", 128);
			}
			if (!ns.serverExists("pserv-0") ||
				ns.getServerMaxRam("pserv-0") < ns.getPurchasedServerMaxRam()) {
				await runAndWait(ns, "start-servers.js", "--auto-upgrade");
			}
			break;
		case 5:
			if (ns.getServerMaxRam("home") < 256) {
				await runAndWait(ns, "purchase-ram.js", "--goal", 256);
			}
			if (!ns.serverExists("pserv-0") ||
				ns.getServerMaxRam("pserv-0") < ns.getPurchasedServerMaxRam()) {
				await runAndWait(ns, "start-servers.js", "--auto-upgrade");
			}
			if (getAvailableMoney(ns) < 1e9) {
				await runAndWait(ns, "start-hacknet.js", 6);
			} else if (getAvailableMoney(ns) < 200e9) {
				await runAndWait(ns, "start-hacknet.js", 8);
			} else if (getAvailableMoney(ns) < 1e12) {
				await runAndWait(ns, "start-hacknet.js", 9);
			} else if (getAvailableMoney(ns) < 50e12) {
				await runAndWait(ns, "start-hacknet.js", 10);
			} else if (getAvailableMoney(ns) < 1e15) {
				await runAndWait(ns, "start-hacknet.js", 12);
			} else if (getAvailableMoney(ns) < 1e18) {
				await runAndWait(ns, "start-hacknet.js", 16, "--maxram");
			} else {
				await runAndWait(ns, "start-hacknet.js", 32, "--maxram");
			}
			if (getAvailableMoney(ns) > 1e15 && ns.getPlayer().hasCorporation &&
				ns.scriptRunning("corporation.js", "home") &&
				!ns.scriptRunning("start-hacknet2.js", "home") &&
				!ns.scriptRunning("start-servers.js", "home") &&
				!ns.scriptRunning("start-servers2.js", "home")) {
				await runAndWait(ns, "purchase-cores.js", "--reserve", 100e12);
				await runAndWait(ns, "purchase-ram.js", "--goal", 1e9, "--reserve", 100e12);
			}
	}
}

/** @param {NS} ns **/
async function runInstallBackdoor(ns) {
	var ram = ns.getServerMaxRam("home");
	if (ram > 32) {
		await runAndWait(ns, "rscan.js", "back", "--quiet");
	} else {
		ns.run("rscan-spawn.js", 1, "back");
	}
}

/** @param {NS} ns **/
async function startHacking(ns, programs) {
	var ram = ns.getServerMaxRam("home");
	if (ram > 32) {
		await runAndWait(ns, "rscan.js", "nuke", "--quiet");
		await runAndWait(ns, "rscan.js", "hack", "--quiet");
	} else {
		await runAndWait(ns, "rscan-spawn.js", "nuke", programs);
		await runAndWait(ns, "rscan-spawn.js", "hack", programs);
	}
}

/** @param {NS} ns **/
async function travelToGoalLocations(ns) {
	const goals = getFactiongoals(ns);
	if (!goals.factionGoals) {
		return;
	}
	const player = ns.getPlayer();
	if (player.skills.hacking < 50) return;
	const minStat = Math.min(player.skills.strength, player.skills.dexterity,
		player.skills.defense, player.skills.agility);
	const factions = player.factions;
	for (var goal of goals.factionGoals.filter(a => a.location && !factions.includes(a.name))) {
		if (player.city != goal.location) {
			if (!goal.money || getAvailableMoney(ns) >= goal.money) {
				if (!goal.stats || goal.stats < minStat) {
					await runAndWait(ns, "travel.js", "--city", goal.location);
				}
			}
		}
	}
}