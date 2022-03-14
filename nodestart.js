import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	await runAndWait(ns, "calculate-factions.js");
	const config = JSON.parse(ns.read("nodestart.txt"));
	ns.tprintf("Config: %s", JSON.stringify(config));

	if (ns.getPlayer().hacking < 100) {
		await firstActions(ns);
	}

	for (var goal of config.factionGoals) {
		ns.tprintf("Next goal: %s", JSON.stringify(goal));
		if (goal.properties.backdoor) {
			var backdoor = goal.properties.backdoor;
			if (!ns.getServer(backdoor).backdoorInstalled) {
				var hackLevel_needed = ns.getServerRequiredHackingLevel(backdoor);
				await runAndWait(ns, "commit-crimes.js", hackLevel_needed);
				var ports_needed = ns.getServerNumPortsRequired(backdoor);
				if (ports_needed > 0) {
					await runAndWait(ns, "writeprogram.js", ports_needed - 1);
				}
				await startHacking(ns);
			}
		}
		if (goal.properties.location) {
			ns.travelToCity(goal.properties.location);
		}
		await workForFactionUntil(ns, config.toJoin, goal.name, goal.properties.work, goal.reputation);
		await runAndWait(ns, "solve_contract.js", "auto");
	}
	ns.spawn("plan-augmentations.js");
}

/** @param {NS} ns **/
async function firstActions(ns) {
	if (ns.getServer("home").maxRam > 32) {
		if (!ns.scriptRunning("instrument.script", "home")) {
			ns.run("instrument.script", 1, "foodnstuff");
		}
	}

	// nuke and hack unprotected hosts
	await startHacking(ns);
	// can't do anything usefull yet, so kill a few people
	await runAndWait(ns, "commit-crimes.js", 50);
	// start work on first program as soon as it becomes available
	await runAndWait(ns, "writeprogram.js", 0);
	// now use it
	await startHacking(ns);
}

/** @param {NS} ns **/
async function workForFactionUntil(ns, wantedFactions, faction, worktype, limit) {
	while (ns.getFactionRep(faction) < limit) {
		await runAndWait(ns, "workforfaction.js", limit, faction, worktype, JSON.stringify(wantedFactions));
		await ns.sleep(300000);
		ns.stopAction();
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
	await runAndWait(ns, "rscan.js", "nuke");
	await runAndWait(ns, "rscan.js", "hack");
	await runAndWait(ns, "rscan.js", "back");
}

function getHacklevel(ns, server) {
	return ns.getServer(server).requiredHackingSkill;
}