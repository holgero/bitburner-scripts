import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["restart", false]]);
	if (!options.restart) {
		await runAndWait(ns, "calculate-factions.js");
	}
	ns.disableLog("sleep");
	const config = JSON.parse(ns.read("nodestart.txt"));
	if (ns.getServer("home").maxRam > 32) {
		if (ns.getServer("home").maxRam > 2048 && ns.getPlayer().hasCorporation) {
			if (ns.getPlayer().playtimeSinceLastAug < 10000) {
				await runAndWait(ns, "corporation2.js", "--milk", "[]");
			}
		}
		if (!ns.scriptRunning("instrument.script", "home")) {
			ns.run("instrument.script", 1, "foodnstuff");
		}
	}
	// get all unprotected servers immediately
	await startHacking(ns);

	var nextProgram = 0;
	var hacknet_nodes = 0;
	var nextServerRam = 32;
	while (config.factionGoals.length > 0) {
		var goal = selectGoal(ns, config.factionGoals);
		var focus = true;
		ns.tprintf("%s goal: %s %d", config.factionGoals.length > 0 ? "Next" : "Last",
			goal.name, goal.reputation);
		while (true) {
			if (goal.location && ns.getPlayer().city != goal.location) {
				ns.travelToCity(goal.location);
			}
			var currentMoney = ns.getServerMoneyAvailable("home");
			// how to spend our money: first priority is to buy all programs
			// the first program is a special case as we must also account fo the tor router
			if (nextProgram == 0 && currentMoney > c.programs[0].cost + 200000) {
				await runAndWait(ns, "writeprogram.js", nextProgram++);
				currentMoney = ns.getServerMoneyAvailable("home");
				await startHacking(ns);
			}
			if (nextProgram < c.programs.length &&
				currentMoney > c.programs[nextProgram].cost) {
				while (nextProgram < c.programs.length && currentMoney > c.programs[nextProgram].cost) {
					await runAndWait(ns, "writeprogram.js", nextProgram++);
					currentMoney = ns.getServerMoneyAvailable("home");
				}
				// use our new programs
				await startHacking(ns);
			}
			// second priority: free money from hacknet
			if (hacknet_nodes == 0 && nextProgram > 2) {
				hacknet_nodes = 4;
				await runAndWait(ns, "start-hacknet.js", hacknet_nodes);
			}
			// thirdly: upgrade server farm
			if (nextProgram > 3) {
				// but not during the last goal
				if (config.factionGoals.length > 0) {
					if (hacknet_nodes == 4) {
						hacknet_nodes = 8;
						await runAndWait(ns, "start-hacknet.js", hacknet_nodes);
					}
					if (currentMoney > ns.getPurchasedServerCost(nextServerRam) * ns.getPurchasedServerLimit()) {
						// start as big as possible
						while (currentMoney > ns.getPurchasedServerCost(nextServerRam * 2) * ns.getPurchasedServerLimit()) {
							nextServerRam *= 2;
						}
						await runAndWait(ns, "start-servers.js", nextServerRam, "upgrade");
						// only upgrade in bigger steps
						nextServerRam *= 8;
					}
				}
			}
			if (nextProgram > 4) {
				await runAndWait(ns, "corporation.js");
			}
			var backdoor = goal.backdoor;
			if (backdoor && !ns.getServer(backdoor).backdoorInstalled) {
				if (ns.getServerRequiredHackingLevel(backdoor) <= ns.getPlayer().hacking &&
					ns.getServerNumPortsRequired(backdoor) <= nextProgram) {
					await startHacking(ns);
				}
			}
			// how to spend our time
			if (!backdoor || ns.getServer(backdoor).backdoorInstalled) {
				ns.stopAction();
				if (ns.getFactionRep(goal.name) > goal.reputation) {
					break;
				}
				ns.tprintf("Goal completion (%s %d): %s %%", goal.name, goal.reputation,
					Math.round(100.0 * ns.getFactionRep(goal.name) / goal.reputation));
				await runAndWait(ns, "workforfaction.js", goal.reputation, goal.name,
					goal.work, JSON.stringify(config.toJoin), JSON.stringify(focus));
				if (ns.isBusy()) {
					await ns.sleep(60000);
				} else {
					// not working for a faction: kill a few people until we progress
					await runAndWait(ns, "commit-crimes.js", ns.getPlayer().hacking + 1);
				}
			} else {
				// not working for a faction: kill a few people until we progress
				await runAndWait(ns, "commit-crimes.js", ns.getPlayer().hacking + 1);
			}
			// check for coding contracts
			await runAndWait(ns, "solve_contract.js", "auto");
			// maybe we can install more backdoors
			await runAndWait(ns, "rscan.js", "back");
			await ns.sleep(20000);
			focus = ns.isFocused();
		}
	}
	ns.spawn("plan-augmentations.js", 1, "--run_purchase");
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
async function runAndWait(ns, script, ...args) {
	ns.run(script, 1, ...args);
	while (ns.scriptRunning(script, "home")) {
		await ns.sleep(1000);
	}
}

/** @param {NS} ns **/
async function startHacking(ns) {
	await runAndWait(ns, "rscan.js", "nuke");
	await runAndWait(ns, "rscan.js", "hack");
	await runAndWait(ns, "rscan.js", "back");
}