import * as c from "constants.js";
import { runAndWait, reputationNeeded } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["restart", false], ["runagain", 0]]);
	ns.disableLog("sleep");
	ns.tprintf("Start at %s", new Date());

	// get all unprotected servers immediately
	await startHacking(ns);

	// set up for corporations
	await runAndWait(ns, "purchase-ram.js", 2048);
	if (ns.getServerMaxRam("home") > ns.getScriptRam("corporation.js")) {
		if (!ns.scriptRunning("corporation.js", "home")) {
			ns.run("corporation.js");
		}
	}

	// use remaining memory on home machine for hacking foodnstuff
	if (!ns.scriptRunning("instrument.js", "home")) {
		ns.run("instrument.js", 1, "--target", "foodnstuff");
	}

	if (!options.restart) {
		ns.rm("stopselling.txt");
		// determine goals for this run
		await runAndWait(ns, "create-database.js");
		await runAndWait(ns, "calculate-goals.js");
	}
	await runAndWait(ns, "print_goals.js");

	const config = JSON.parse(ns.read("nodestart.txt"));
	var daedalus = config.factionGoals.find(a => a.name == c.DAEDALUS);
	if (!daedalus || !daedalus.augmentations.includes(c.RED_PILL)) {
		config.factionGoals.push({ name: c.WORLD_DAEMON, backdoor: c.WORLD_DAEMON });
	}

	await workOnGoals(ns, config);

	if (options.runagain < 3 && ns.getServerMoneyAvailable("home") > 2 * await getEstimation(ns, false)) {
		// too much money left, do a re-spawn once
		ns.spawn("nodestart.js", 1, "--runagain", "" + (+options.runagain + 1));
	}

	if (ns.getPlayer().hasCorporation && ns.fileExists("corporation.txt", "home")) {
		var corporationInfo = JSON.parse(ns.read("corporation.txt"));
		if (corporationInfo.shareSaleCooldown) {
			for (var goal of config.factionGoals.filter(a => a.company)) {
				if (!ns.getPlayer().factions.includes(goal.name)) {
					await runAndWait(ns, "workforcompany.js", goal.name, "IT", "[]", "true");
					break;
				}
			}
			var cooldown = corporationInfo.shareSaleCooldown / 5;
			var bonus = corporationInfo.bonusTime / 1000;
			var realtime;
			if (cooldown > 10 * bonus / 9) {
				realtime = cooldown - bonus;
			} else {
				realtime = cooldown / 10;
			}
			if (realtime > 10) {
				ns.tprintf("Share sale cooldown period: %d s", realtime);
				await ns.sleep(1000 * (realtime - 10));
			}
			ns.scriptKill("corporation.js", "home");
			await ns.sleep(10000);
			ns.stopAction();
		}
	}

	ns.spawn("plan-augmentations.js", 1, "--run_purchase", "--affordable");
}

/** @param {NS} ns **/
async function workOnGoals(ns, config) {
	if (config.factionGoals.some(a => a.reputation)) {
		if (!await workOnGoalsPercentage(ns, config, 0.25)) return;
		if (!await workOnGoalsPercentage(ns, config, 0.50)) return;
		if (!await workOnGoalsPercentage(ns, config, 0.75)) return;
		if (!await workOnGoalsPercentage(ns, config, 1.00)) return;
	} else {
		ns.tprintf("No goals!");
	}
	ns.tprintf("Finished all goals");
}

/** @param {NS} ns **/
async function checkForDaedalus(ns, config) {
	if (config.finalGoal) {
		return;
	}
	const goals = config.factionGoals;
	if (ns.getPlayer().factions.includes(c.DAEDALUS) &&
		goals.some(a => a.name == c.DAEDALUS && a.augmentations.includes(c.RED_PILL))) {
		var goal = goals.find(a => a.name == c.DAEDALUS);
		// single minded now, there are no other goals...
		config.finalGoal = goal;
		goals.forEach(a => a.reputation = 0);
		if (goal.reputation == 0) {
			if (goal.favor < ns.getFavorToDonate()) {
				goal.reputation = reputationNeeded(ns, goal.name);
				await ns.write("stopselling.txt", "{goal:Daedalus}", "w");
				config.estimatedDonations = 0;
			}
		}
		if (goal.favor >= ns.getFavorToDonate()) {
			// reach the red pill
			const database = JSON.parse(ns.read("database.txt"));
			goal.reputation = database.augmentations.find(a => a.name == c.RED_PILL).reputation;
			config.estimatedDonations = 1;
		}
		await ns.write("nodestart.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: 0,
			estimatedDonations: config.estimatedDonations
		}), "w");
		config.estimatedPrice = await getEstimation(ns, true);
		await ns.write("nodestart.txt", JSON.stringify({
			factionGoals: goals,
			estimatedPrice: config.estimatedPrice,
			estimatedDonations: config.estimatedDonations
		}), "w");

		await runAndWait(ns, "print_goals.js");
	}
}

/** @param {NS} ns **/
async function workOnGoalsPercentage(ns, config, percentage) {
	ns.tprintf("Round of goals at %d %%", percentage * 100);
	const goals = config.factionGoals;
	while (true) {
		await checkForDaedalus(ns, config);
		goals.forEach(a => a.achieved = a.reputation ?
			ns.getFactionRep(a.name) / percentage : 0);
		var goal = await selectGoal(ns, goals, config);
		if (!goal) break;
		await workOnGoal(ns, goal, percentage, goals, config);
		if (goal==config.finalGoal) break;
	}
	if (Math.max(1e9, ns.getServerMoneyAvailable("home")) < await getEstimation(ns, false)) {
		return false;
	}
	return true;
}

/** @param {NS} ns **/
async function getEstimation(ns, goal) {
	if (goal) {
		await runAndWait(ns, "estimate.js", "--write", "--goal");
	} else {
		await runAndWait(ns, "estimate.js", "--write");
	}
	var estimation = JSON.parse(ns.read("estimate.txt"));
	ns.rm("estimate.txt", "home");
	return estimation.estimatedPrice;
}

/** @param {NS} ns **/
async function workOnGoal(ns, goal, percentage, goals, config) {
	if (!goal.reputation || ns.getFactionRep(goal.name) >= percentage * goal.reputation) {
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
	ns.tprintf("goal: %s %d", goal.name, percentage * goal.reputation);
	ns.printf("Next server ram size: %d GB, next program to aquire: %s",
		nextServerRam, nextProgram < c.programs.length ? c.programs[nextProgram].name : "(complete)");
	while (true) {
		if (!ns.getPlayer().factions.includes(goal.name) && goal.location) {
			await runAndWait(ns, "travel.js", "--city", goal.location);
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
			if (ns.getPlayer().hacking > 2000) {
				await runAndWait("optimize-hacking.js");
			}
		}

		await installBackdoorIfNeeded(ns, goal.backdoor, nextProgram);
		// how to spend our time
		if (ns.getPlayer().hacking < 100) {
			// don't waste time with other stuff while our hacking level is low
			await runAndWait(ns, "university.js", "--course", "CS", "--focus", JSON.stringify(focus));
			await runAndWait(ns, "commit-crimes.js", "--timed", 60, "--until_hack", 100);
			focus = ns.isFocused();
			ns.stopAction();
		} else {
			if (!goal.backdoor || ns.getServer(goal.backdoor).backdoorInstalled) {
				ns.printf("At start of checks");
				if (await buffStatsToNeeded(ns, goal.stats, focus)) {
					ns.printf("No workout needed");
					ns.stopAction();
					if (config.estimatedDonations) {
						var moneyForDonations = Math.max(0,
							ns.getServerMoneyAvailable("home") - config.estimatedPrice);
						if (ns.getPlayer().hasCorporation &&
							ns.fileExists("corporation.txt", "home")) {
							var corporationInfo = JSON.parse(ns.read("corporation.txt"));
							if (corporationInfo.issuedShares > 0) {
								// dont donate money that is needed for buyback
								moneyForDonations = 0;
							}
						}
						if (moneyForDonations) {
							ns.printf("Will donate %d", moneyForDonations);
							await runAndWait(ns, "donate-faction.js",
								goal.name, percentage * goal.reputation, moneyForDonations);
						}
					}
					if (ns.getFactionRep(goal.name) > percentage * goal.reputation) {
						break;
					}
					var percentComplete = (100.0 * ns.getFactionRep(goal.name) / (percentage * goal.reputation)).toFixed(1);
					ns.tprintf("Goal completion (%s %d/%d): %s %%", goal.name,
						ns.getFactionRep(goal.name),
						percentage * goal.reputation,
						percentComplete);
					ns.toast(goal.name + ": " + percentComplete + " %", "success", 5000);
					if (goals.filter(a => a.reputation > 0 && a.reputation > ns.getFactionRep(a.name)).length == 0 &&
						percentage > 0.999 &&
						percentComplete > 90) {
						await ns.write("stopselling.txt", "{lastgoal:" + percentComplete + "}", "w");
					}
					var toJoin = [];
					var factions = ns.getPlayer().factions;
					for (var tGoal of goals) {
						if (!factions.includes(tGoal.name)) {
							toJoin.push(tGoal.name);
						}
					}
					if (goal.company && !ns.getPlayer().factions.includes(goal.name)) {
						ns.printf("Start working at company");
						await runAndWait(ns, "workforcompany.js", goal.name, "IT",
							JSON.stringify(toJoin), JSON.stringify(focus));
					}
					ns.printf("Start working for faction");
					await runAndWait(ns, "workforfaction.js", goal.name, goal.work,
						JSON.stringify(toJoin), JSON.stringify(focus));
					if (goal.name != c.DAEDALUS) {
						await checkForDaedalus(ns, config);
						if (config.finalGoal) {
							// we have more important things to do
							return;
						}
					}
					if (ns.isBusy()) {
						await ns.sleep(60000);
					} else {
						ns.printf("Not working");
						// not working for a faction: kill a few people
						await runAndWait(ns, "commit-crimes.js", "--timed", 60);
					}
				}
			} else {
				ns.printf("Not working and nothing to do");
				if (nextProgram == 0) {
					await runAndWait(ns, "writeprogram.js", nextProgram++);
					await startHacking(ns);
				} else {
					// not working for a faction: kill a few people
					await runAndWait(ns, "commit-crimes.js", "--timed", 60);
				}
			}
			focus = ns.isFocused();
		}
		// check for coding contracts
		await runAndWait(ns, "solve_contract.js", "auto");
		// join future factions early, if we can
		await futureGoalConditions(ns, goals, nextProgram);
		await ns.sleep(20000);
		if (!ns.getPlayer().factions.includes(c.DAEDALUS) && goal.name == c.DAEDALUS) {
			// don't wait for DAEDALUS invitation within this loop, do something else instead
			break;
		}
	}
}

/** @param {NS} ns **/
async function selectGoal(ns, goals, config) {
	if (config.finalGoal) {
		return config.finalGoal;
	}
	goals.sort((a, b) => (a.reputation - a.achieved) - (b.reputation - b.achieved));
	goals.reverse();
	var factions = ns.getPlayer().factions;
	var runGoals = goals.filter(a => (a.reputation - a.achieved) > 0);
	if (runGoals.length == 0) {
		return undefined;
	}
	for (var goal of runGoals) {
		if (factions.includes(goal.name)) {
			return goal;
		}
	}
	// everything that follows is only possible in the first round where the
	// player has not joined all necessary factions
	// start with the factions that require stats
	var statsFactions = runGoals.filter(a => a.stats).sort((a, b) => (a.stats - b.stats));
	if (statsFactions.length > 0) {
		return statsFactions[0];
	}
	for (var goal of runGoals) {
		if (!goal.backdoor && !goal.company && !goal.money || goal.money <= 1.1 * ns.getServerMoneyAvailable("home")) {
			return goal;
		}
	}
	for (var goal of runGoals) {
		if (!goal.company) {
			return goal;
		}
	}
	for (var goal of runGoals) {
		return goal;
	}
	return undefined;
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
async function buffStatsToNeeded(ns, stats, focus) {
	if (!stats) {
		return true;
	}
	var statsTooLow = lowStats(ns, stats);
	if (statsTooLow.length == 0) {
		return true;
	}
	ns.printf("Too low on stats: %s", JSON.stringify(statsTooLow));
	if (statsTooLow.length == 1) {
		await runAndWait(ns, "workout.js", statsTooLow[0], focus);
	} else {
		await runAndWait(ns, "commit-crimes.js", "--until_stats", stats, "--timed", 60);
	}
	return false;
}

/** @param {NS} ns **/
async function installBackdoorIfNeeded(ns, server, nextProgram) {
	ns.printf("Install backdoor if needed: %s %d", server, nextProgram);
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
		ns.printf("Checking future goal %s", goal.name);
		if (ns.getPlayer().factions.includes(goal.name)) {
			continue;
		}
		await installBackdoorIfNeeded(ns, goal.backdoor, nextProgram);
		if (goal.location && ns.getPlayer().city != goal.location) {
			if (!goal.money || ns.getServerMoneyAvailable("home") >= goal.money) {
				if (!goal.stats || lowStats(ns, goal.stats).length == 0) {
					await runAndWait(ns, "travel.js", "--city", goal.location);
					return;
				}
			}
		}
	}
}

/** @param {NS} ns **/
async function startHacking(ns) {
	await runAndWait(ns, "rscan.js", "nuke", "--quiet");
	await runAndWait(ns, "rscan.js", "hack", "--quiet");
	await runAndWait(ns, "rscan.js", "back", "--quiet");
}