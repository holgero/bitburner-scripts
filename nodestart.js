import * as c from "constants.js";
import { runAndWait, goalCompletion } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMaxRam");
	ns.tprintf("Start at %s", new Date());

	// get all unprotected servers immediately
	await startHacking(ns);

	// set up for corporations
	await runAndWait(ns, "purchase-ram.js", 2048);
	if (ns.getServerMaxRam("home") > ns.getScriptRam("corporation.js")) {
		if (!ns.scriptRunning("corporation.js", "home")) {
			ns.rm("stopselling.txt");
			ns.run("corporation.js");
		}
	}
	await runAndWait(ns, "create-database.js");

	await runHomeScripts(ns);

	await runAndWait(ns, "start-hacknet.js", 1);
	await progressHackingLevels(ns);
}

/** @param {NS} ns **/
async function runHomeScripts(ns) {
	if (!ns.scriptRunning("bladeburner.js", "home")) {
		ns.run("bladeburner.js", 1, ...ns.args);
		await ns.sleep(1000);
	}

	if (ns.scriptRunning("bladeburner.js", "home")) {
		if (ns.scriptRunning("factiongoals.js", "home")) {
			ns.scriptKill("factiongoals.js", "home");
		}
	} else {
		if (!ns.scriptRunning("factiongoals.js", "home")) {
			await runAndWait(ns, "calculate-goals.js", "--money", 500e6);
			ns.run("factiongoals.js", 1, ...ns.args);
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
	if (ns.scriptRunning("factiongoals.js", "home")) {
		if (ns.fileExists("factiongoals.txt")) {
			var completion = goalCompletion(ns, JSON.parse(ns.read("factiongoals.txt")).factionGoals);
			if (completion > 0.8) {
				return false;
			}
		}
	}
	return true;
}

/** @param {NS} ns **/
async function progressHackingLevels(ns) {
	var lastHackingLevelRun = 0;
	while (true) {
		var nextProgram = 0;
		while (nextProgram < c.programs.length && ns.fileExists(c.programs[nextProgram].name)) {
			nextProgram++;
		}
		if (nextProgram > lastHackingLevelRun) {
			await startHacking(ns);
			lastHackingLevelRun = nextProgram;
		}
		if (canSpendMoney(ns)) {
			await improveInfrastructure(ns, nextProgram);
		}
		await runAndWait(ns, "solve_contract.js", "--auto");
		await runAndWait(ns, "joinfactions.js");
		await travelToGoalLocations(ns);
		await runInstallBackdoor(ns);
		await ns.sleep(30000);
	}
}

/** @param {NS} ns **/
async function improveInfrastructure(ns, nextProgram) {
	var currentMoney = ns.getServerMoneyAvailable("home");
	// how to spend our money: first priority is to buy all programs
	// the first program is a special case as we must also account fo the tor router
	if (nextProgram == 0 && currentMoney > c.programs[0].cost + 200000) {
		await runAndWait(ns, "writeprogram.js", nextProgram++);
		currentMoney = ns.getServerMoneyAvailable("home");
		await runAndWait(ns, "start-hacknet.js", 2);
	}
	if (nextProgram > 0 &&
		nextProgram < c.programs.length &&
		currentMoney > c.programs[nextProgram].cost) {
		while (nextProgram < c.programs.length && currentMoney > c.programs[nextProgram].cost) {
			await runAndWait(ns, "writeprogram.js", nextProgram++);
			currentMoney = ns.getServerMoneyAvailable("home");
		}
		await runAndWait(ns, "start-hacknet.js", 4);
	}
	// upgrade home pc
	if (nextProgram > 2) {
		if (ns.getServerMaxRam("home") < 64) {
			await runAndWait(ns, "upgradehomeserver.js", 64);
			if (ns.getServerMaxRam("home") >= 64) {
				await runHomeScripts(ns);
			}
		}
	}
	// upgrade server farm
	if (nextProgram > 3) {
		await runAndWait(ns, "start-hacknet.js", 8);
		if (!ns.serverExists("pserv-0") || ns.getServerMaxRam("pserv-0") < ns.getPurchasedServerMaxRam()) {
			await runAndWait(ns, "start-servers.js", "--auto-upgrade");
			if (ns.getPlayer().hacking > 2000) {
				await runAndWait(ns, "optimize-hacking.js");
			}
		}
	}
	currentMoney = ns.getServerMoneyAvailable("home");
	if (nextProgram >= c.programs.length &&
		(ns.getPlayer().hasCorporation || currentMoney > 150e9) &&
		!ns.scriptRunning("corporation.js", "home")) {
		await runAndWait(ns, "purchase-ram.js", 2048);
		ns.run("corporation.js");
	}
}

/** @param {NS} ns **/
async function runInstallBackdoor(ns) {
	var ram = ns.getServerMaxRam("home");
	if (ram > 32) {
		await runAndWait(ns, "rscan.js", "back", "--quiet");
	} else {
		ns.run("rscan-spawn.js", 1, "back", "--quiet");
	}
}

/** @param {NS} ns **/
async function startHacking(ns) {
	await runAndWait(ns, "rscan.js", "nuke", "--quiet");
	await runAndWait(ns, "rscan.js", "hack", "--quiet");
}

/** @param {NS} ns **/
async function travelToGoalLocations(ns) {
	if (!ns.fileExists("factiongoals.txt")) {
		return;
	}
	const player = ns.getPlayer();
	if (player.hacking < 50) return;
	const minStat = Math.min(player.strength, player.dexterity, player.defense, player.agility);
	const factions = player.factions;
	var goals = JSON.parse(ns.read("factiongoals.txt")).factionGoals;
	for (var goal of goals.filter(a => a.location && !factions.includes(a.name))) {
		if (player.city != goal.location) {
			if (!goal.money || ns.getServerMoneyAvailable("home") >= goal.money) {
				if (!goal.stats || goal.stats < minStat) {
					await runAndWait(ns, "travel.js", "--city", goal.location);
				}
			}
		}
	}
}