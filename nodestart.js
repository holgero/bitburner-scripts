import * as c from "constants.js";

const AUGS_PER_RUN = 7;
const AUGS_PER_FACTION = 2;

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["restart", false]]);
	ns.disableLog("sleep");

	// get all unprotected servers immediately
	await startHacking(ns);

	if (ns.getServer("home").maxRam > 32) {
		if (ns.getServer("home").maxRam > 2048 && ns.getPlayer().hasCorporation) {
			if (ns.getPlayer().playtimeSinceLastAug < 10000) {
				await runAndWait(ns, "corporation2.js", "--milk", "[]");
				await runAndWait(ns, "start-hacknet.js", 16);
			}
		}
		if (!ns.scriptRunning("instrument.script", "home")) {
			ns.run("instrument.script", 1, "foodnstuff");
		}
	}

	if (!options.restart) {
		var augsPerRun = AUGS_PER_RUN;
		var augsPerFaction = AUGS_PER_FACTION;
		if (ns.getServerMoneyAvailable("home") > 1e12) {
			// profitable factory means bigger goals
			augsPerRun += 3;
			augsPerFaction++;
		}
		await runAndWait(ns, "calculate-goals.js", augsPerRun, augsPerFaction);
	}
	await runAndWait(ns, "print_goals.js");
	const config = JSON.parse(ns.read("nodestart.txt"));
	var runGoals = config.factionGoals.slice(0);
	while (runGoals.length > 0) {
		var goal = selectGoal(ns, runGoals);
		await workOnGoal(ns, goal, 0.5, runGoals);
	}
	runGoals = config.factionGoals.slice(0);
	runGoals.forEach(a => a.achieved = ns.getFactionRep(a.name));
	runGoals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved) );
	runGoals.reverse();
	while (runGoals.length > 0) {
		var goal = selectGoal(ns, runGoals);
		if (goal) await workOnGoal(ns, goal, 0.75, runGoals);
	}
	runGoals = config.factionGoals.slice(0);
	runGoals.forEach(a => a.achieved = ns.getFactionRep(a.name));
	runGoals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved) );
	runGoals.reverse();
	while (runGoals.length > 0) {
		var goal = selectGoal(ns, runGoals);
		if (goal) await workOnGoal(ns, goal, 1, runGoals);
	}
	ns.spawn("plan-augmentations.js", 1, "--run_purchase");
}

/** @param {NS} ns **/
async function workOnGoal(ns, goal, percentage, goals) {
	if (ns.getFactionRep(goal.name) >= percentage * goal.reputation) {
		return;
	}
	var focus = true;
	var nextProgram = 0;
	while (nextProgram < c.programs.length && ns.fileExists(c.programs[nextProgram].name)) {
		nextProgram++;
	}
	var nextServerRam = 32;
	if (ns.serverExists("pserv-0")) {
		nextServerRam = 8 * ns.getServerMaxRam("pserv-0");
	}
	var firstHacknetNode = false;
	ns.tprintf("%s goal: %s %d", goals.length > 0 ? "Next" : "Last", goal.name,
		percentage * goal.reputation);
	ns.tprintf("Next server ram size: %d GB, next program to aquire: %s",
		nextServerRam, nextProgram < c.programs.length ? c.programs[nextProgram].name : "(complete)");
	while (true) {
		if (!ns.getPlayer().factions.includes(goal.name) && goal.location && ns.getPlayer().city != goal.location) {
			ns.travelToCity(goal.location);
		}
		var currentMoney = ns.getServerMoneyAvailable("home");
		if (nextProgram == 0 && !firstHacknetNode) {
			await runAndWait(ns, "start-hacknet.js", 1);
			firstHacknetNode = true;
		}
		// how to spend our money: first priority is to buy all programs
		// the first program is a special case as we must also account fo the tor router
		if (nextProgram == 0 && currentMoney > c.programs[0].cost + 200000) {
			await runAndWait(ns, "writeprogram.js", nextProgram++);
			currentMoney = ns.getServerMoneyAvailable("home");
			await startHacking(ns);
			await runAndWait(ns, "start-hacknet.js", 2);
		}
		if (nextProgram > 0 &&
			nextProgram < c.programs.length &&
			currentMoney > c.programs[nextProgram].cost) {
			while (nextProgram < c.programs.length && currentMoney > c.programs[nextProgram].cost) {
				await runAndWait(ns, "writeprogram.js", nextProgram++);
				currentMoney = ns.getServerMoneyAvailable("home");
			}
			// use our new programs
			await startHacking(ns);
			await runAndWait(ns, "start-hacknet.js", 4);
		}
		// upgrade home pc
		if (nextProgram > 2) {
			if (ns.getServerMaxRam("home") < 64) {
				await runAndWait(ns, "upgradehomeserver.js", 64);
				if (ns.getServerMaxRam("home") >= 64) {
					if (!ns.scriptRunning("instrument.script", "home")) {
						ns.run("instrument.script", 1, "foodnstuff");
					}
				}
			}
		}
		// upgrade server farm
		if (nextProgram > 3) {
			// but not during the last goal
			if (goals.length > 0 || percentage < 1.0) {
				if (currentMoney > ns.getPurchasedServerCost(nextServerRam) * ns.getPurchasedServerLimit()) {
					// start as big as possible
					while (currentMoney > ns.getPurchasedServerCost(nextServerRam * 2) * ns.getPurchasedServerLimit()) {
						nextServerRam *= 2;
					}
					await runAndWait(ns, "start-servers.js", nextServerRam, "upgrade");
					// only upgrade in bigger steps
					nextServerRam *= 8;
					await runAndWait(ns, "start-hacknet.js", 8);
				}
			}
		}
		if (nextProgram > 4) {
			await runAndWait(ns, "corporation.js", "--quiet");
		}
		var backdoor = goal.backdoor;
		await installBackdoorIfNeeded(ns, backdoor, nextProgram);
		// how to spend our time
		if (ns.getPlayer().hacking < 100) {
			// don't waste time with other stuff while our hacking level is low
			await runAndWait(ns, "commit-crimes.js", "--until_hack", ns.getPlayer().hacking + 1);
		} else {
			if (!backdoor || ns.getServer(backdoor).backdoorInstalled) {
				if (goal.stats) {
					await buffStatsToNeeded(ns, goal.stats);
				}
				ns.stopAction();
				if (ns.getServerMoneyAvailable("home") > 150000000000) {
					await runAndWait(ns, "donate-faction.js",
						goal.name, percentage * goal.reputation, ns.getServerMoneyAvailable("home") - 100000000000);
				}
				if (ns.getFactionRep(goal.name) > percentage * goal.reputation) {
					break;
				}
				var percentComplete =(100.0 * ns.getFactionRep(goal.name) / (percentage * goal.reputation)).toFixed(1);
				ns.tprintf("Goal completion (%s %d/%d): %s %%", goal.name,
					ns.getFactionRep(goal.name),
					percentage * goal.reputation,
					percentComplete);
				ns.toast(goal.name + ": " + percentComplete + " %", "success", 5000);
				var toJoin = [];
				var factions = ns.getPlayer().factions;
				for (var tGoal of goals) {
					if (!factions.includes(tGoal.name)) {
						toJoin.push(tGoal.name);
					}
				}
				if (goal.company && !ns.getPlayer().factions.includes(goal.name)) {
					await runAndWait(ns, "workforcompany.js", goal.name, "IT",
						JSON.stringify(toJoin), JSON.stringify(focus));
				}
				await runAndWait(ns, "workforfaction.js", goal.name, goal.work,
					JSON.stringify(toJoin), JSON.stringify(focus));
				if (ns.isBusy()) {
					await ns.sleep(60000);
				} else {
					// not working for a faction: kill a few people until we progress
					await runAndWait(ns, "commit-crimes.js", "--until_hack", ns.getPlayer().hacking + 1);
				}
			} else {
				// not working for a faction: kill a few people until we progress
				await runAndWait(ns, "commit-crimes.js", "--until_hack", ns.getPlayer().hacking + 1);
			}
		}
		// check for coding contracts
		await runAndWait(ns, "solve_contract.js", "auto");
		// join future factions early, if we can
		await futureGoalConditions(ns, goals, nextProgram);
		await ns.sleep(20000);
		focus = ns.isFocused();
	}
}

/** @param {NS} ns **/
function selectGoal(ns, goals) {
	var money = ns.getServerMoneyAvailable("home");
	var factions = ns.getPlayer().factions;
	for (var ii = 0; ii < goals.length; ii++) {
		var goal = goals[ii];
		if (factions.includes(c.DAEDALUS)) {
			if (goal.name != c.DAEDALUS) {
				goals.splice(ii, 1);
				ii--;
				continue;
			}
		}
		if (factions.includes(goal.name) || (!goal.money || goal.money <= 1.2 * money)) {
			goals.splice(ii, 1);
			return goal;
		}
	}
	return goals.shift();
}

/** @param {NS} ns **/
async function lowStats(ns, stats) {
	var player = ns.getPlayer();
	var result = [];
	if (player.agility < stats) {
		result.push("Agility");
	}
	if (player.dexterity < stats) {
		result.push("Dexterity");
	}
	if (player.defense < stats) {
		result.push("Defense");
	}
	if (player.strength < stats) {
		result.push("Strength");
	}
	return result;
}

/** @param {NS} ns **/
async function buffStatsToNeeded(ns, stats) {
	var statsTooLow = lowStats(ns, stats);
	if (statsTooLow.length == 1) {
		await runAndWait(ns, "workout.js", statsTooLow[0]);
	} else {
		await runAndWait(ns, "commit-crimes.js", "--until_stats", stats);
	}
}

/** @param {NS} ns **/
async function installBackdoorIfNeeded(ns, server, nextProgram) {
	if (server && !ns.getServer(server).backdoorInstalled) {
		if (ns.getServerRequiredHackingLevel(server) <= ns.getPlayer().hacking &&
			ns.getServerNumPortsRequired(server) <= nextProgram) {
			await startHacking(ns);
		}
	}
}

/** @param {NS} ns **/
async function futureGoalConditions(ns, goals, nextProgram) {
	for (var goal of goals) {
		if (ns.getPlayer().factions.includes(goal.name)) {
			continue;
		}
		await installBackdoorIfNeeded(ns, goal.backdoor, nextProgram);
		if (goal.location && ns.getPlayer().city != goal.location) {
			if (!goal.money || ns.getServerMoneyAvailable("home") >= goal.money) {
				if (!goal.stats || lowStats(ns, goal.stats).length == 0) {
					ns.travelToCity(goal.location);
				}
				return;
			}
		}
	}
}

/** @param {NS} ns **/
async function runAndWait(ns, script, ...args) {
	ns.run(script, 1, ...args);
	while (ns.scriptRunning(script, "home")) {
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
async function startHacking(ns) {
	await runAndWait(ns, "rscan.js", "nuke", "--quiet");
	await runAndWait(ns, "rscan.js", "hack", "--quiet");
	await runAndWait(ns, "rscan.js", "back", "--quiet");
}