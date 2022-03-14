import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	await runAndWait(ns, "calculate-factions.js");
	const config = JSON.parse(ns.read("nodestart.txt"));
	ns.tprintf("Config: %s", JSON.stringify(config));

	var bootcount = await getCounter(ns);
	ns.tprintf("Started %d. run", +bootcount + 1);
	await firstActions(ns, bootcount);

	for (var goal of config.factionGoals) {
		switch (goal.name) {
			case c.NITESEC:
				await runAndWait(ns, "commit-crimes.js", getHacklevel(ns, "avmnite-02h"));
				await runAndWait(ns, "rscan.js", "hack");
				await runAndWait(ns, "rscan.js", "back");
				break;
			case c.BLACK_HAND:
				await runAndWait(ns, "writeprogram.js", 2);
				await startHacking(ns);
				await runAndWait(ns, "commit-crimes.js", getHacklevel(ns, "I.I.I.I")); // Black Hand
				await runAndWait(ns, "rscan.js", "hack");
				await runAndWait(ns, "rscan.js", "back");
				break;
		}
		await workForFactionUntil(ns, config.toJoin, goal.name, c.HACKING, goal.reputation);
		await runAndWait(ns, "solve_contract.js", "auto");
	}
	ns.spawn("plan-augmentations.js");

	return;

	await runAndWait(ns, "start-hacknet.js", bootcount);

	if (bootcount < 8) {
		await runAndWait(ns, "commit-crimes.js", getHacklevel(ns, "I.I.I.I")); // Black Hand
		await runAndWait(ns, "rscan.js", "hack");
		await runAndWait(ns, "rscan.js", "back");
	}
	await runAndWait(ns, "writeprogram.js", 3);
	await startHacking(ns);
	if (bootcount < 9) {
		await runAndWait(ns, "commit-crimes.js", getHacklevel(ns, "run4theh111z")); // BitRunners
		await runAndWait(ns, "rscan.js", "hack");
		await runAndWait(ns, "rscan.js", "back");
	}
	await runAndWait(ns, "start-servers.js", 512);

	switch (bootcount) {
		case 6:
			await workForFactionUntil(ns, wantedFactions, c.BLACK_HAND, c.HACKING, 50000);
			await workForFactionUntil(ns, wantedFactions, c.BITRUNNERS, c.HACKING, 100000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js");
			break;
		case 7:
			await workForFactionUntil(ns, wantedFactions, c.BLACK_HAND, c.HACKING, 100000);
			await workForFactionUntil(ns, wantedFactions, c.BITRUNNERS, c.HACKING, 200000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js");
			break;
		case 8:
			await workForFactionUntil(ns, [], c.BITRUNNERS, c.HACKING, 1000000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js");
			break
	}
	await runAndWait(ns, "writeprogram.js", 4);
	await startHacking(ns);
	await runAndWait(ns, "solve_contract.js", "auto");

	switch (bootcount) {
		case 9:
			await workForFactionUntil(ns, [], c.DAEDALUS, c.HACKING, 1000000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js");
			break
	}
}

/** @param {NS} ns **/
async function getCounter(ns) {
	var player = ns.getPlayer();
	if (player.playtimeSinceLastAug == player.playtimeSinceLastBitnode) {
		ns.rm("count.txt");
	}
	var bootcount = ns.read("count.txt");
	if (bootcount == "") {
		bootcount = 0;
	}
	await ns.write("count.txt", bootcount, "w");

	return +bootcount;
}

/** @param {NS} ns **/
async function writeCounter(ns, bootcount) {
	await ns.write("count.txt", bootcount, "w");
}

/** @param {NS} ns **/
async function firstActions(ns, bootcount) {
	if (ns.getServer("home").maxRam > 32) {
		if (!ns.scriptRunning("instrument.script", "home")) {
			ns.run("instrument.script", 1, "foodnstuff");
		}
	}
	if (bootcount < 6) {
		await runAndWait(ns, "start-hacknet.js", bootcount);
	}
	await runAndWait(ns, "solve_contract.js", "auto");
	if (ns.getPlayer().hacking > 100) return;

	// nuke and hack unprotected hosts
	await startHacking(ns);
	// can't do anything usefull yet, so kill a few people
	await runAndWait(ns, "commit-crimes.js", 50);
	// start work on first program as soon as it becomes available
	await runAndWait(ns, "writeprogram.js", 0);
	// now use it
	await startHacking(ns);
	while (!ns.getServer("CSEC").backdoorInstalled) {
		await runAndWait(ns, "commit-crimes.js", getHacklevel(ns, "CSEC"));
		await runAndWait(ns, "rscan.js", "back");
		await ns.sleep(5000);
	}
	// if we are going to join CyberSec later on anyway, do it right now
	if (bootcount < 3) {
		await runAndWait(ns, "workforfaction.js", 1, c.CYBERSEC, c.HACKING, JSON.stringify([c.CYBERSEC, c.NETBURNERS]));
	} else {
		// don't join unecessarily a faction
		await runAndWait(ns, "commit-crimes.js", 100);
	}

	// do the second program, too
	await runAndWait(ns, "writeprogram.js", 1);
	await startHacking(ns);
	await runAndWait(ns, "solve_contract.js", "auto");
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