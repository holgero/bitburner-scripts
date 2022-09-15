import * as c from "constants.js";
import { runAndWait, goalCompletion, getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMaxRam");
	ns.tprintf("Start at %s", new Date());

	var startState;
	const player = ns.getPlayer();
	if (player.playtimeSinceLastBitnode < 60 * 60 * 1000) {
		ns.tprintf("Fresh start in a new bitnode");
		startState = "fresh";
	} else if (player.playtimeSinceLastAug < 60 * 1000) {
		ns.tprintf("Start after installing augmentations");
		startState = "augs";
	} else {
		ns.tprintf("Restart during a run. Killing all home scripts");
		killOthers(ns);
		if (player.hasTixApiAccess) await runAndWait(ns, "sell-all-stocks.js");
		startState = "restart";
	}

	if (ns.getPlayer().bitNodeN == 8) {
		// take a share of the initial money to develop hacking a bit faster 
		var money = Math.min(100e9, getAvailableMoney(ns, true) - 10e6);
		await ns.write("reserved-money.txt", JSON.stringify(money), "w");
	} else {
		await ns.write("reserved-money.txt", JSON.stringify(0), "w");
	}

	if (startState != "restart") {
		// get all unprotected servers immediately
		await startHacking(ns, getProgramCount(ns));
		await runAndWait(ns, "create-database.js");
		await runAndWait(ns, "calculate-goals.js");
	}

	if (ns.getPlayer().bitNodeN != 8) {
		await setUpForCorporations(ns);
	}

	await runHomeScripts(ns);

	await runAndWait(ns, "start-hacknet.js", 1);
	await progressHackingLevels(ns);
}

function killOthers(ns) {
	ns.scriptKill("instrument.js", "home");
	ns.scriptKill("factiongoals.js", "home");
	ns.scriptKill("trader.js", "home");
	ns.scriptKill("bladerunner.js", "home");
	ns.scriptKill("corporation.js", "home");
	ns.scriptKill("do-weaken.js", "home");
	ns.scriptKill("do-hack.js", "home");
	ns.scriptKill("do-grow.js", "home");
}

async function setUpForCorporations(ns) {
	var currentMoney = getAvailableMoney(ns);
	if ((ns.getPlayer().hasCorporation || currentMoney > 150e9) &&
		!ns.scriptRunning("corporation.js", "home")) {
		var ramBefore = ns.getServerMaxRam("home");
		await runAndWait(ns, "purchase-ram.js", 2048);
		if (ns.getServerMaxRam("home") >= 2048) {
			currentMoney = getAvailableMoney(ns);
			if (ns.getPlayer().hasCorporation || currentMoney > 150e9) {
				killOthers(ns);
				ns.run("corporation.js");
				await ns.sleep(1000);
				await runHomeScripts(ns);
			}
		}
		if (ns.getServerMaxRam("home") != ramBefore) {
			await runHomeScripts(ns);
		}
	}
}

/** @param {NS} ns **/
async function runHomeScripts(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	if (ns.scriptRunning("instrument.js", "home")) {
		ns.scriptKill("instrument.js", "home");
	}
	if (ns.getPlayer().bitNodeN == 8) {
		if (!ns.scriptRunning("trader.js", "home")) {
			ns.run("trader.js");
		}
	}
	if (ns.getServerMaxRam("home") > 32) {
		if (ns.scriptRunning("factiongoals.js", "home")) {
			ns.scriptKill("factiongoals.js", "home");
		}
		if (!ns.scriptRunning("bladeburner.js", "home")) {
			if (ns.getServerMaxRam("home") > 1024 &&
				ns.getPlayer().hasCorporation) {
				await runAndWait(ns, "joinbladeburner.js", "--division", "--faction");
			}
			ns.run("bladeburner.js", 1, ...ns.args);
			await ns.sleep(1000);
		}
	}
	if (ns.scriptRunning("bladeburner.js", "home") &&
		!database.owned_augmentations.includes(c.BLADE_SIMUL)) {
		if (ns.scriptRunning("factiongoals.js", "home")) {
			ns.scriptKill("factiongoals.js", "home");
		}
	} else {
		if (!ns.scriptRunning("factiongoals.js", "home") &&
			(ns.getServerMaxRam("home") > 32 || !ns.scriptRunning("trader.js", "home"))) {
			ns.run("factiongoals.js", 1, ...ns.args);
		}
	}
	if (!ns.scriptRunning("trader.js", "home")) {
		if (ns.getPlayer().hasTixApiAccess && getAvailableMoney(ns) > 200e6) {
			var money = Math.min(100e9, getAvailableMoney(ns, true) - 10e6);
			await ns.write("reserved-money.txt", JSON.stringify(money), "w");
			ns.run("trader.js");
		}
	}
	if (!ns.scriptRunning("instrument.js", "home")) {
		ns.run("instrument.js", 1);
	}
}

/** @param {NS} ns **/
function canSpendMoney(ns) {
	if (ns.getPlayer().hasCorporation && ns.fileExists("corporation.txt", "home")) {
		var corporationInfo = JSON.parse(ns.read("corporation.txt"));
		if (corporationInfo.issuedShares > 0) {
			return false;
		}
	}
	if (ns.fileExists("factiongoals.txt")) {
		var completion = goalCompletion(ns, JSON.parse(ns.read("factiongoals.txt")).factionGoals);
		if (completion > 0.5) {
			return false;
		}
	}
	return true;
}

/** @param {NS} ns **/
async function progressHackingLevels(ns) {
	var lastHackingLevelRun = 0;
	while (true) {
		const nextProgram = getProgramCount(ns);
		if (nextProgram > lastHackingLevelRun) {
			await startHacking(ns, nextProgram);
			lastHackingLevelRun = nextProgram;
		}
		if (canSpendMoney(ns)) {
			await improveInfrastructure(ns, nextProgram);
		} else {
			ns.scriptKill("start-hacknet.js", "home");
			ns.scriptKill("start-hacknet2.js", "joesguns");
		}
		await runAndWait(ns, "solve_contract.js", "--auto");
		await runAndWait(ns, "spend-hashes.js");
		await runAndWait(ns, "joinfactions.js");
		await runAndWait(ns, "joinbladeburner.js", "--faction");
		await travelToGoalLocations(ns);
		await runInstallBackdoor(ns);
		await ns.sleep(30000);
	}
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
async function improveInfrastructure(ns, nextProgram) {
	var currentMoney = getAvailableMoney(ns);
	// how to spend our money: first priority is to buy all programs
	// the first program is a special case as we must also account fo the tor router
	if (nextProgram == 0 && currentMoney > c.programs[0].cost + 200000) {
		await runAndWait(ns, "writeprogram.js", nextProgram++);
		currentMoney = getAvailableMoney(ns);
		await runAndWait(ns, "start-hacknet.js", 2);
	}
	if (nextProgram > 0 &&
		nextProgram < c.programs.length &&
		currentMoney > c.programs[nextProgram].cost) {
		while (nextProgram < c.programs.length && currentMoney > c.programs[nextProgram].cost) {
			await runAndWait(ns, "writeprogram.js", nextProgram++);
			currentMoney = getAvailableMoney(ns);
		}
		await runAndWait(ns, "start-hacknet.js", 3);
	}
	// upgrade home pc
	if (nextProgram > 2) {
		if (ns.getServerMaxRam("home") < 64) {
			await runAndWait(ns, "purchase-ram.js", 64);
			if (ns.getServerMaxRam("home") >= 64) {
				await runHomeScripts(ns);
			}
		}
	}
	// upgrade server farm
	if (nextProgram > 3) {
		await runAndWait(ns, "start-hacknet.js", 4);
		if (!ns.serverExists("pserv-0") ||
			ns.getServerMaxRam("pserv-0") < ns.getPurchasedServerMaxRam()) {
			await runAndWait(ns, "start-servers.js", "--auto-upgrade");
			if (ns.getPlayer().skills.hacking > 2000) {
				await runAndWait(ns, "optimize-hacking.js");
			}
		}
	}
	currentMoney = getAvailableMoney(ns);
	if (nextProgram >= c.programs.length) {
		if (currentMoney < 1e9) {
			await runAndWait(ns, "start-hacknet.js", 6);
		} else if (currentMoney < 1e12) {
			// might have a bit more money to spend on hacknet nodes
			await runAndWait(ns, "start-hacknet.js", 10);
			// and for the home server
			if (ns.getServerMaxRam("home") < 256) {
				await runAndWait(ns, "purchase-ram.js", 256);
				if (ns.getServerMaxRam("home") >= 256) {
					await runHomeScripts(ns);
				}
			}
		} else if (currentMoney < 1e15) {
			// might have quite a bit more money to spend on hacknet nodes
			await runAndWait(ns, "start-hacknet.js", 12);
		} else {
			// pull out all stops
			await runAndWait(ns, "start-hacknet.js", 16, "--maxram");
		}
		await setUpForCorporations(ns);
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
	if (!ns.fileExists("factiongoals.txt")) {
		return;
	}
	const player = ns.getPlayer();
	if (player.skills.hacking < 50) return;
	const minStat = Math.min(player.skills.strength, player.skills.dexterity,
		player.skills.defense, player.skills.agility);
	const factions = player.factions;
	var goals = JSON.parse(ns.read("factiongoals.txt")).factionGoals;
	for (var goal of goals.filter(a => a.location && !factions.includes(a.name))) {
		if (player.city != goal.location) {
			if (!goal.money || getAvailableMoney(ns) >= goal.money) {
				if (!goal.stats || goal.stats < minStat) {
					await runAndWait(ns, "travel.js", "--city", goal.location);
				}
			}
		}
	}
}