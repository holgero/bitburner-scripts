import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	await runAndWait(ns, "calculate-factions.js");
	const config = JSON.parse(ns.read("nodestart.txt"));
	if (ns.getServer("home").maxRam > 32) {
		if (!ns.scriptRunning("instrument.script", "home")) {
			ns.run("instrument.script", 1, "foodnstuff");
		}
	}
	// get all unprotected servers immediately
	await startHacking(ns);

	var nextProgram = 0;
	var hacknet_started = false;
	var nextServerRam = 32;
	for (var goal of config.factionGoals) {
		ns.tprintf("Next goal: %s", JSON.stringify(goal));
		while (true) {
			if (goal.properties.location) {
				ns.travelToCity(goal.properties.location);
			}
			var currentMoney = ns.getServerMoneyAvailable("home");
			// how to spend our money: first priority is to buy all needed programs
			if (nextProgram < c.programs.length &&
				currentMoney > c.programs[nextProgram].cost + 200000) {
				while (nextProgram < c.programs.length &&
					currentMoney > c.programs[nextProgram].cost + 200000) {
					await runAndWait(ns, "writeprogram.js", nextProgram++);
					currentMoney = ns.getServerMoneyAvailable("home");
				}
				// use our new programs
				await startHacking(ns);
			}
			// second priority: free money from hacknet
			if (!hacknet_started && nextProgram > 2) {
				await runAndWait(ns, "start-hacknet.js", 1);
				hacknet_started = true;
			}
			// thirdly: upgrade server farm
			if (nextProgram >= c.programs.length) {
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
			var backdoor = goal.properties.backdoor;
			if (backdoor && !ns.getServer(backdoor).backdoorInstalled) {
				if (ns.getServerRequiredHackingLevel(backdoor) <= ns.getPlayer().hacking &&
					ns.getServerNumPortsRequired(backdoor) <= nextProgram) {
					await startHacking(ns);
				}
			}
			// how to spend our time
			if (!backdoor || ns.getServer(backdoor).backdoorInstalled) {
				ns.stopAction();
				if (ns.getFactionRep(goal.name) > goal.reputation) break;
				await runAndWait(ns, "workforfaction.js", goal.reputation, goal.name, goal.properties.work, JSON.stringify(config.toJoin));
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
			await ns.sleep(20000);
		}
	}
	ns.spawn("plan-augmentations.js", 1, "--run_purchase");
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