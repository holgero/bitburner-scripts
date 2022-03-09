import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");

	var bootcount = await getCounter(ns);
	ns.tprintf("Started %d. run", +bootcount + 1);
	await firstActions(ns, bootcount);

	var wantedFactions = [c.CYBERSEC, c.NETBURNERS, c.SECTOR12,
		c.SLUM_SNAKES, c.NITESEC, c.BLACK_HAND, c.RUNNERS];

	switch (bootcount) {
		case 0:
			await workForFactionUntil(ns, wantedFactions, c.CYBERSEC, c.HACKING, 2000);
			await workForFactionUntil(ns, wantedFactions, c.NETBURNERS, c.HACKING, 2500);
			await workForFactionUntil(ns, wantedFactions, c.SECTOR12, c.HACKING, 5000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.CYBERSEC, c.NETBURNERS, c.SECTOR12, c.AEVUM);
			break;
		case 1:
			await workForFactionUntil(ns, wantedFactions, c.CYBERSEC, c.HACKING, 10000);
			await workForFactionUntil(ns, wantedFactions, c.NETBURNERS, c.HACKING, 7500);
			await workForFactionUntil(ns, wantedFactions, c.SECTOR12, c.HACKING, 7500);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.CYBERSEC, c.NETBURNERS, c.SECTOR12);
			break;
		case 2:
			await workForFactionUntil(ns, wantedFactions, c.CYBERSEC, c.HACKING, 18750);
			await workForFactionUntil(ns, wantedFactions, c.NETBURNERS, c.HACKING, 12500);
			await workForFactionUntil(ns, wantedFactions, c.SECTOR12, c.HACKING, 12500);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.CYBERSEC, c.NETBURNERS, c.SECTOR12);
			break;
	}
	wantedFactions.shift();
	wantedFactions.shift();
	wantedFactions.shift();
	
	await runAndWait(ns, "commit-crimes.js", getHacklevel(ns, "avmnite-02h"));
	await runAndWait(ns, "rscan.js", "hack");
	await runAndWait(ns, "rscan.js", "back");
	await runAndWait(ns, "solve_contract.js", "auto");

	switch (bootcount) {
		case 3:
			await workForFactionUntil(ns, wantedFactions, c.NITESEC, c.HACKING, 15000);
			if (ns.getPlayer().factions.includes(c.SLUM_SNAKES)) {
				await workForFactionUntil(ns, wantedFactions, c.SLUM_SNAKES, c.FIELDWORK, 1500);
			} else {
				await workForFactionUntil(ns, wantedFactions, c.NITESEC, c.HACKING, 20000);
				await writeCounter(ns, ++bootcount);
			}
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.SLUM_SNAKES, c.NITESEC);
			break;
		case 4:
			await workForFactionUntil(ns, wantedFactions, c.NITESEC, c.HACKING, 20000);
			if (ns.getPlayer().factions.includes(SLUMS_NAKES)) {
				await workForFactionUntil(ns, wantedFactions, c.SLUM_SNAKES, c.FIELDWORK, 5000);
			} else {
				await workForFactionUntil(ns, wantedFactions, c.NITESEC, c.HACKING, 50000);
				await writeCounter(ns, ++bootcount);
			}
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.SLUM_SNAKES, c.NITESEC);
			break;
		case 5:
			await workForFactionUntil(ns, wantedFactions, c.NITESEC, c.HACKING, 50000);
			if (ns.getPlayer().factions.includes(c.SLUM_SNAKES)) {
				await workForFactionUntil(ns, wantedFactions, c.SLUM_SNAKES, c.FIELDWORK, 22500);
			}
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.SLUM_SNAKES, c.NITESEC);
			break;
	}
	wantedFactions.shift();
	wantedFactions.shift();

	await runAndWait(ns, "writeprogram.js", 2);
	await startHacking(ns);
	await runAndWait(ns, "solve_contract.js", "auto");
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
			await workForFactionUntil(ns, wantedFactions, c.RUNNERS, c.HACKING, 100000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.RUNNERS, c.BLACK_HAND);
			break;
		case 7:
			await workForFactionUntil(ns, wantedFactions, c.BLACK_HAND, c.HACKING, 100000);
			await workForFactionUntil(ns, wantedFactions, c.RUNNERS, c.HACKING, 200000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.BLACK_HAND, c.RUNNERS);
			break;
		case 8:
			await workForFactionUntil(ns, wantedFactions, c.RUNNERS, c.HACKING, 1000000);
			await runAndWait(ns, "solve_contract.js", "auto");
			ns.spawn("plan-augmentations.js", 1, c.RUNNERS);
			break
	}
	await runAndWait(ns, "writeprogram.js", 4);
	await startHacking(ns);
	await runAndWait(ns, "solve_contract.js", "auto");
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