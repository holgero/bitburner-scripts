import * as c from "constants.js";

const MAX_TRADER_MONEY = 100e9;

import {
	runAndWait,
	goalCompletion,
	getAvailableMoney,
	getStartState,
	getDatabase,
	getFactiongoals,
	getEstimation,
	isEndgame
} from "helpers.js";
import { getBudget, getHolding, reserveBudget, deleteBudget } from "budget.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("Start at %s", new Date());
	await killOthers(ns);
	ns.disableLog("sleep");
	ns.disableLog("getServerMaxRam");

	if (getStartState(ns) != "restart") {
		await runAndWait(ns, "clean-files.js");
		await runAndWait(ns, "database/create.js");
		// hacky: create preliminary empty factiongoals
		await runAndWait(ns, "calculate-goals.js", "--money", 1);
		await startHacking(ns, getProgramCount(ns));
	}

	await setUpForTrader(ns);
	await setUpForCorporations(ns);

	await progressHackingLevels(ns);

	await killOthers(ns);
	deleteBudget(ns, "stocks");
	await runAndWait(ns, "spend-hashes.js", "--all");
	if (getDatabase(ns).owned_augmentations.includes(c.RED_PILL)) {
		await runAndWait(ns, "destroy-world.js");
	}
	await runAndWait(ns, "plan-augmentations.js", "--run_purchase");
}

async function killOthers(ns) {
	ns.scriptKill("instrument.js", "home");
	ns.scriptKill("factiongoals.js", "home");
	ns.scriptKill("joinbladeburner.js", "home");
	ns.scriptKill("bladeburner.js", "home");
	ns.scriptKill("corporation.js", "home");
	await runAndWait(ns, "corpstart.js", "--stop");
	ns.scriptKill("do-weaken.js", "home");
	ns.scriptKill("do-hack.js", "home");
	ns.scriptKill("do-grow.js", "home");
	await stopTrader(ns);
}

/** @param {NS} ns **/
async function setUpForTrader(ns) {
	const bitNode = ns.getPlayer().bitNodeN;
	if (bitNode != 8) {
		return;
	}
	if (ns.getServerMaxRam("home") >= 256) {
		return;
	}
	await runAndWait(ns, "purchase-ram.js", "--goal", 256);
	await runAndWait(ns, "plan-augmentations.js", "--run_purchase");
	ns.exit();
}

/** @param {NS} ns **/
async function setUpForCorporations(ns) {
	const bitNode = ns.getPlayer().bitNodeN;
	if (bitNode == 8) {
		return;
	}
	if ((ns.corporation.hasCorporation() ||
		getAvailableMoney(ns, true) > 150e9 ||
		bitNode == 3) &&
		!ns.scriptRunning("corporation.js", "home")) {
		await runAndWait(ns, "purchase-ram.js", "--goal", 2048);
		if (ns.getServerMaxRam("home") >= 2048) {
			if (ns.corporation.hasCorporation() ||
				getAvailableMoney(ns, true) > 150e9 ||
				bitNode == 3) {
				await killOthers(ns);
				ns.run("corporation.js");
				// give it a chance to run before trader
				await ns.sleep(10000);
				return;
			}
		} else {
			if (bitNode == 3) {
				ns.run("corpstart.js");
			}
		}
	}
}

/** @param {NS} ns **/
async function startTrader(ns) {
	if (!ns.stock.hasTIXAPIAccess() && getAvailableMoney(ns) > 10e9) {
		await runAndWait(ns, "purchase-stock-api.js");
	}
	if (ns.stock.hasTIXAPIAccess() &&
		!ns.scriptRunning("trader.js", "home") &&
		!ns.scriptRunning("trader2.js", "home")) {
		if (!ns.stock.has4SDataTIXAPI() && ns.getPlayer().bitNodeN == 8 &&
			getAvailableMoney(ns, true) > 27e9) { // 1e9 for 4SData, 25e9 for 4SDataTIXAPI + 1e9 for trading
			await runAndWait(ns, "purchase-stock-api.js", "--all");
			deleteBudget(ns, "stocks");
		}
		const stockBudget = getBudget(ns, "stocks");
		deleteBudget(ns, "stocks");
		const money = Math.min(MAX_TRADER_MONEY, getAvailableMoney(ns) - 10e6);
		if (stockBudget < 100e6) {
			reserveBudget(ns, "stocks", money);
		} else {
			reserveBudget(ns, "stocks", Math.min(stockBudget, money));
		}
		if (ns.stock.has4SDataTIXAPI()) {
			ns.run("trader2.js");
		} else {
			ns.run("trader.js");
		}
	}
}

/** @param {NS} ns **/
async function stopTrader(ns) {
	const stockHolding = getHolding(ns, "stocks") + getBudget(ns, "stocks");
	if (ns.scriptRunning("trader.js", "home")) {
		ns.scriptKill("trader.js", "home");
	}
	if (ns.scriptRunning("trader2.js", "home")) {
		ns.scriptKill("trader2.js", "home");
	}
	if (ns.stock.hasTIXAPIAccess()) {
		await runAndWait(ns, "sell-all-stocks.js");
	}
	deleteBudget(ns, "stocks");
	const money = Math.min(MAX_TRADER_MONEY, getAvailableMoney(ns) - 10e6);
	if (money > 0 && stockHolding > 0 && ns.stock.hasTIXAPIAccess()) {
		reserveBudget(ns, "stocks", Math.min(stockHolding, money));
	}
}

/** @param {NS} ns **/
async function runHomeScripts(ns) {
	const database = getDatabase(ns);
	ns.print("Run home scripts");
	if (ns.getPlayer().bitNodeN == 8 ||
		(ns.getServerMaxRam("home") > 32 &&
			(getAvailableMoney(ns) > 1e9 || getBudget(ns, "stocks") > 100e6))) {
		await startTrader(ns);
	}
	await ns.sleep(1000);
	if (database.features.bladeburners) {
		startHomeScript(ns, "bladeburner.js");
		await ns.sleep(1000);
		if (ns.getServerMaxRam("home") > 1024 && ns.corporation.hasCorporation()) {
			startHomeScript(ns, "joinbladeburner.js", "--division", "--faction");
		}
		await ns.sleep(1000);
	}
	startHomeScript(ns, "factiongoals.js");
	await ns.sleep(1000);
	if (database.features.sleeves) {
		startHomeScript(ns, "sleeves.js");
		await ns.sleep(1000);
	}
	if (database.features.gangs) {
		startHomeScript(ns, "gangs.js");
		await ns.sleep(1000);
	}
	if (goForHacking(ns)) {
		if (ns.isRunning("instrument.js", "home")) {
			ns.scriptKill("instrument.js", "home");
		}
		startHomeScript(ns, "instrument.js", "--hack");
	} else {
		startHomeScript(ns, "instrument.js");
	}
}

/** @param {NS} ns **/
function startHomeScript(ns, scriptName, ...args) {
	if (!ns.scriptRunning(scriptName, "home")) {
		ns.run(scriptName, 1, ...args);
	}
}

/** @param {NS} ns **/
async function canSpendMoney(ns, started) {
	if (await wantToEndRun(ns, started)) {
		return false;
	}
	if (getAvailableMoney(ns) > 1e15) {
		// there's plenty
		return true;
	}
	if (isEndgame(ns)) {
		const goals = getFactiongoals(ns).factionGoals;
		const completion = goalCompletion(ns, goals);
		return completion < 0.8;
	}
	const estimation = await getEstimation(ns, false);
	if ((estimation.prioritizedAugmentationCount +
		estimation.affordableAugmentationCount) >= 11) {
		// nearly there, no longer spend money
		return false;
	}
	if (estimation.prioritizedAugmentationCount > 0 &&
		ns.getPlayer().playtimeSinceLastAug > 30 * 60 * 60 * 1000) {
		return false;
	}
	if (new Date() - started > 20 * 60 * 60 * 1000) {
		// nearly runs for a day, stop spending money
		return false;
	}
	return true;
}

/** @param {NS} ns **/
async function progressHackingLevels(ns) {
	await runAndWait(ns, "start-hacknet.js", 1);
	var started = Date.now();
	while (true) {
		await runHomeScripts(ns);
		const nextProgram = await purchaseHackingPrograms(ns);
		await startHacking(ns, nextProgram);
		if (await wantToEndRun(ns, started)) {
			return;
		}
		if (await canSpendMoney(ns, started)) {
			await improveInfrastructure(ns, nextProgram, started);
		} else {
			ns.scriptKill("start-hacknet.js", "home");
			ns.scriptKill("start-hacknet2.js", "joesguns");
		}
		if (!ns.scriptRunning("joinbladeburner.js", "home")) {
			await runAndWait(ns, "joinbladeburner.js", "--faction");
			await runAndWait(ns, "spend-hashes.js");
		}
		await runAndWait(ns, "joinfactions.js");
		await setUpForCorporations(ns);
		await travelToGoalLocations(ns);
		await meetMoneyGoals(ns);
		await runAndWait(ns, "rback.js");
		await runAndWait(ns, "stanek.js");
		if (!ns.stock.has4SDataTIXAPI() && ns.getPlayer().bitNodeN == 8 &&
			getAvailableMoney(ns, true) > 28e9) {
			await killOthers(ns);
		}
		await runAndWait(ns, "solve_contract.js", "--auto");
		await ns.sleep(20000);
	}
}

/** @param {NS} ns **/
async function wantToEndRun(ns, started) {
	await runAndWait(ns, "check-end.js", "--quiet", "--started", started);
	const theEnd = JSON.parse(ns.read("check-end.txt"));
	return theEnd.end;
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
async function purchaseHackingPrograms(ns) {
	var nextProgram = getProgramCount(ns);
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
	// if only nuking the world daemon is missing to end the world
	if (nextProgram == c.programs.length - 1 &&
		getDatabase(ns).owned_augmentations.includes(c.RED_PILL) &&
		!ns.hasRootAccess(c.WORLD_DAEMON) &&
		getAvailableMoney(ns, true) > c.programs[nextProgram].cost &&
		ns.getPlayer().skills.hacking >= ns.getServerRequiredHackingLevel(c.WORLD_DAEMON)) {
		await killOthers(ns);
		deleteBudget(ns, "stocks");
		await runAndWait(ns, "writeprogram.js", nextProgram++);
	}
	return nextProgram;
}

/** @param {NS} ns **/
async function improveInfrastructure(ns, programsOwned, started) {
	const database = getDatabase(ns);
	await runAndWait(ns, "start-hacknet.js", programsOwned);

	switch (programsOwned) {
		case 3:
			await runAndWait(ns, "purchase-ram.js", "--goal", 64);
			break;
		case 4:
			await runAndWait(ns, "purchase-ram.js", "--goal", 128);
			if (!ns.serverExists("pserv-0") ||
				ns.getServerMaxRam("pserv-0") < ns.getPurchasedServerMaxRam()) {
				await runAndWait(ns, "start-servers.js", "--auto-upgrade");
			}
			break;
		case 5:
			if (!ns.serverExists("pserv-0") ||
				ns.getServerMaxRam("pserv-0") < ns.getPurchasedServerMaxRam()) {
				if (goForHacking(ns)) {
					await runAndWait(ns, "start-servers.js", "--auto-upgrade", "--hack");
					await runAndWait(ns, "rscan.js", "hackhack", "--quiet");
				} else {
					await runAndWait(ns, "start-servers.js", "--auto-upgrade");
				}
			}
			await runAndWait(ns, "purchase-ram.js", "--goal", 1e99, "--reserve", getAvailableMoney(ns) / 2);
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
			if (getAvailableMoney(ns) > 1e15 && ns.corporation.hasCorporation() &&
				ns.scriptRunning("corporation.js", "home") &&
				!ns.scriptRunning("start-hacknet2.js", "home") &&
				!ns.scriptRunning("start-servers.js", "home") &&
				!ns.scriptRunning("start-servers2.js", "home")) {
				await runAndWait(ns, "purchase-cores.js", "--reserve", 200e12);
				await runAndWait(ns, "purchase-ram.js", "--goal", 1e9, "--reserve", 200e12);
				if (database.features.graft &&
					!await wantToEndRun(ns, started) &&
					!isEndgame(ns)) {
					await runAndWait(ns, "travel.js", "--city", c.NEW_TOKYO);
					startHomeScript(ns, "graft-augmentation.js");
				}
			}
			if (ns.stock.hasTIXAPIAccess() && database.bitnodemultipliers) {
				const multiplier = database.bitnodemultipliers.FourSigmaMarketDataApiCost ?
					database.bitnodemultipliers.FourSigmaMarketDataApiCost : 1;
				if (!ns.stock.has4SDataTIXAPI() && getAvailableMoney(ns, true) > multiplier * 50e9) {
					await killOthers(ns);
					await runAndWait(ns, "purchase-stock-api.js", "--all");
				}
			}
	}
}

/** @param {NS} ns **/
async function startHacking(ns, programs) {
	await runAndWait(ns, "rnuke.js", programs);
	if (goForHacking(ns)) {
		await runAndWait(ns, "rscan.js", "hackhack", "--quiet");
	} else {
		await runAndWait(ns, "rhack.js");
	}
}

async function meetMoneyGoals(ns) {
	const goals = getFactiongoals(ns);
	if (!goals.factionGoals) {
		return;
	}
	if (!ns.scriptRunning("trader.js", "home") && !ns.scriptRunning("trader2.js", "home")) {
		return;
	}
	const maxPossibleMoney = getAvailableMoney(ns, true);
	const availableMoney = getAvailableMoney(ns);
	const player = ns.getPlayer();
	const bitNode = player.bitNodeN;
	if (bitNode == 8) {
		// not sure about this
		// return;
	}
	for (var goal of goals.factionGoals.filter(a => a.money && !player.factions.includes(a.name))) {
		if (goal.hack && ns.getPlayer().skills.hacking < 0.999 * goal.hack) {
			continue;
		}
		if (goal.stats) {
			const minStat = Math.min(player.skills.strength, player.skills.dexterity,
				player.skills.defense, player.skills.agility);
			if (minStat < 0.999 * goal.stats) {
				continue;
			}
		}
		if (goal.location && player.city != goal.location) {
			continue;
		}
		if (goal.money > availableMoney && goal.money < maxPossibleMoney) {
			ns.tprintf("Making money available to join %s", goal.name);
			await stopTrader(ns);
		}
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

/** @param {NS} ns **/
function goForHacking(ns) {
	if (getDatabase(ns).owned_augmentations.includes(c.RED_PILL) &&
		ns.getPlayer().skills.hacking >= 0.9 * ns.getServerRequiredHackingLevel(c.WORLD_DAEMON)) {
		return true;
	}
	return false;
}