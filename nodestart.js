import * as c from "constants.js";
import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["restart", false], ["lasttime", false]]);
	ns.disableLog("sleep");
	ns.tprintf("Start at %s", new Date());

	// get all unprotected servers immediately
	await startHacking(ns);

	if (ns.getPlayer().bitNodeN == 3) {
		// on bitnode 3 we rely completely on the corporation, so make sure that
		// the corporation script can be run locally
		await runAndWait(ns, "purchase-ram.js", 2048);
		await runAndWait(ns, "corporation2.js", "--local", "--quiet", "--setup");
		await runAndWait(ns, "corporation2.js", "--local", "--quiet", "--milk");
		var spareRam = Math.ceil(64 + ns.getScriptRam("corporation2.js"));
		if (!ns.scriptRunning("instrument.js", "home")) {
			ns.run("instrument.js", 1, "--target", "foodnstuff", "--spare", spareRam);
		}
	} else {
		// if we have a corporation we can start this run with some easy money on restart
		if (ns.getPlayer().playtimeSinceLastAug < 10000) {
			await runAndWait(ns, "corporation.js", "--milk");
			// wait for a potential spawn...
			await ns.sleep(20000);
		}
		// make use of the memory on our home machine
		if (ns.getServer("home").maxRam > 32) {
			if (!ns.scriptRunning("instrument.js", "home")) {
				ns.run("instrument.js", 1, "foodnstuff");
			}
		}
	}

	if (!options.restart) {
		// determine goals for this run
		await runAndWait(ns, "calculate-goals.js");
	}
	await runAndWait(ns, "print_goals.js");

	const config = JSON.parse(ns.read("nodestart.txt"));
	await workOnGoals(ns, config);

	if (!options.lasttime && ns.getServerMoneyAvailable("home") > 2 * await getEstimation(ns)) {
		// too much money left, do a re-spawn once
		ns.spawn("nodestart.js", 1, "--lasttime");
	}

	if (ns.getPlayer().hasCorporation && ns.ls("home", "corporation.txt").length) {
		var corporationInfo = JSON.parse(ns.read("corporation.txt"));
		ns.rm("corporation.txt", "home");
		if (corporationInfo.shareSaleCooldown) {
			for (var goal of config.factionGoals.filter(a => a.company)) {
				if (!ns.getPlayer().factions.includes(goal.name)) {
					await runAndWait(ns, "workforcompany.js", goal.name, "IT", "[]", "true");
					break;
				}
			}
			await ns.sleep(200 * corporationInfo.shareSaleCooldown);
			ns.stopAction();
		}
	}

	ns.spawn("plan-augmentations.js", 1, "--run_purchase", "--affordable");
}

/** @param {NS} ns **/
async function workOnGoals(ns, config) {
	var runGoals = config.factionGoals.slice(0);
	while (runGoals.length > 0) {
		var goal = selectGoal(ns, runGoals);
		await workOnGoal(ns, goal, 0.25, runGoals, config);
	}

	if (ns.getServerMoneyAvailable("home") < await getEstimation(ns)) {
		return;
	}

	runGoals = config.factionGoals.slice(0);
	runGoals.forEach(a => a.achieved = ns.getFactionRep(a.name));
	runGoals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved));
	runGoals.reverse();
	while (runGoals.length > 0) {
		var goal = selectGoal(ns, runGoals);
		if (goal) await workOnGoal(ns, goal, 0.75, runGoals, config);
	}

	if (ns.getServerMoneyAvailable("home") < await getEstimation(ns)) {
		return;
	}

	runGoals = config.factionGoals.slice(0);
	runGoals.forEach(a => a.achieved = ns.getFactionRep(a.name));
	runGoals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved));
	runGoals.reverse();
	while (runGoals.length > 0) {
		var goal = selectGoal(ns, runGoals);
		if (goal) await workOnGoal(ns, goal, 1, runGoals, config);
	}
}

/** @param {NS} ns **/
async function getEstimation(ns) {
	await runAndWait(ns, "estimate.js", "--write");
	var estimation = JSON.parse(ns.read("estimate.txt"));
	ns.rm("estimate.txt", "home");
	return estimation.estimatedPrice;
}

/** @param {NS} ns **/
async function workOnGoal(ns, goal, percentage, goals, config) {
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
					if (!ns.scriptRunning("instrument.js", "home")) {
						ns.run("instrument.js", 1, "foodnstuff");
					}
				}
			}
		}
		if (ns.getPlayer().bitNodeN == 3) {
			// on bitnode 3 we'll have to rely on corporation money
			await runAndWait(ns, "corporation2.js", "--local", "--quiet", "--setup");
			var corporationInfo = JSON.parse(ns.read("corporation.txt"));
			var profit = corporationInfo.revenue - corporationInfo.expenses;
			var rps = Math.floor((corporationInfo.funds / 100000 + corporationInfo.revenue) / corporationInfo.sharePrice / 1000);
			ns.tprintf("Corporation: share=%s, profit=%s, rps=%d, cool=%d s, owned=%d",
				formatMoney(corporationInfo.sharePrice), formatMoney(profit), rps,
				Math.ceil(corporationInfo.shareSaleCooldown / 5), corporationInfo.numShares);
			if (corporationInfo.numShares > 0 && corporationInfo.shareSaleCooldown == 0 && percentage < 1.0) {
				if (rps < 15) {
					await runAndWait(ns, "corporation2.js", "--local", "--sell");
				}
			}
			if (corporationInfo.issuedShares > 0 && (corporationInfo.shareSaleCooldown < 12000 ||
				percentage >= 1.0)) {
				if (rps > 20 || percentage >= 1.0) {
					var needed = (1e9 - corporationInfo.numShares) * corporationInfo.sharePrice * 1.1;
					if (needed < ns.getServerMoneyAvailable("home")) {
						await runAndWait(ns, "corporation2.js", "--local", "--buy");
					} else {
						ns.tprintf("Want to buy back corporation shares. Need %s, have %s",
							formatMoney(needed), formatMoney(ns.getServerMoneyAvailable("home")));
					}
				}
			}
		} else {
			if (nextProgram > 4) {
				await runAndWait(ns, "corporation.js", "--quiet", "--setup");
			}
		}
		// upgrade server farm
		if (nextProgram > 3) {
			// but not during the last round
			if (percentage < 1.0) {
				if (currentMoney > ns.getPurchasedServerCost(nextServerRam) * ns.getPurchasedServerLimit()) {
					// start as big as possible
					while (currentMoney > ns.getPurchasedServerCost(nextServerRam * 2) * ns.getPurchasedServerLimit()) {
						nextServerRam *= 2;
					}
					if (ns.getPlayer().bitNodeN == 3) {
						// do not spend too much on servers on corporation bitnode
						nextServerRam = Math.min(1024, nextServerRam);
					}
					if (!ns.serverExists("pserv-0")
						|| (nextServerRam >= ns.getServerMaxRam("pserv-0") * 8)) {
						await runAndWait(ns, "start-servers.js", "--ram", nextServerRam, "--upgrade");
						// only upgrade in bigger steps
						nextServerRam *= 8;
						await runAndWait(ns, "start-hacknet.js", 8);
					}
				}
			}
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
				if (config.estimatedDonations) {
					var moneyForDonations = Math.max(0,
						ns.getServerMoneyAvailable("home") - config.estimatedPrice);
					if (moneyForDonations) {
						await runAndWait(ns, "donate-faction.js",
							goal.name, percentage * goal.reputation, moneyForDonations);
					}
				}
				ns.stopAction();
				if (ns.getFactionRep(goal.name) > percentage * goal.reputation) {
					break;
				}
				var percentComplete = (100.0 * ns.getFactionRep(goal.name) / (percentage * goal.reputation)).toFixed(1);
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
		if (factions.includes(goal.name) || (!goal.money || goal.money <= 1.2 * money)) {
			goals.splice(ii, 1);
			return goal;
		}
	}
	return goals.shift();
}

/** @param {NS} ns **/
function lowStats(ns, stats) {
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
	// ns.tprintf("Too low on stats: %s", JSON.stringify(statsTooLow));
	if (statsTooLow.length == 1) {
		await runAndWait(ns, "workout.js", statsTooLow[0]);
	} else {
		await runAndWait(ns, "commit-crimes.js", "--until_stats", stats);
	}
}

/** @param {NS} ns **/
async function installBackdoorIfNeeded(ns, server, nextProgram) {
	// ns.tprintf("Install backdoor if needed: %s %d", server, nextProgram);
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
		// ns.tprintf("Checking future goal %s", goal.name);
		if (ns.getPlayer().factions.includes(goal.name)) {
			continue;
		}
		await installBackdoorIfNeeded(ns, goal.backdoor, nextProgram);
		if (goal.location && ns.getPlayer().city != goal.location) {
			if (!goal.money || ns.getServerMoneyAvailable("home") >= goal.money) {
				if (!goal.stats || lowStats(ns, goal.stats).length == 0) {
					ns.travelToCity(goal.location);
					return;
				}
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