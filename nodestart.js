var CYBERSEC = "CyberSec";
var NETBURNERS = "Netburners";
var SLUMSNAKES = "Slum Snakes";
var NITESEC = "NiteSec";
var BLACKHAND = "The Black Hand";
var RUNNERS = "BitRunners";
var FIELDWORK = "Field Work";
var HACKING = "Hacking Contracts";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");

	var bootcount = await getCounter(ns);
	ns.tprintf("Started %d. run", +bootcount + 1);
	if (ns.getServer("home").maxRam > 32) {
		if (!ns.scriptRunning("instrument.script", "home")) {
			ns.run("instrument.script", 1, "foodnstuff");
		}
	}
	if (ns.getPlayer().hacking < 100) {
		await firstActions(ns, bootcount);
	}

	switch (bootcount) {
		case 0:
			await workForFactionUntil(ns, CYBERSEC, HACKING, 3750);
			await workForFactionUntil(ns, NETBURNERS, HACKING, 2000);
			ns.spawn("purchase-augmentations.js", 1, CYBERSEC, NETBURNERS);
			break;
		case 1:
			await workForFactionUntil(ns, CYBERSEC, HACKING, 10000);
			await workForFactionUntil(ns, NETBURNERS, HACKING, 7500);
			ns.spawn("purchase-augmentations.js", 1, CYBERSEC, NETBURNERS);
			break;
		case 2:
			await workForFactionUntil(ns, CYBERSEC, HACKING, 18750);
			await workForFactionUntil(ns, NETBURNERS, HACKING, 12500);
			ns.spawn("purchase-augmentations.js", 1, CYBERSEC, NETBURNERS);
			break;
	}

	await runAndWait(ns, "commit-crimes.js", 214); // hack level of avmnite-2h
	await runAndWait(ns, "rscan.js", "hack");
	await runAndWait(ns, "rscan.js", "back");

	switch (bootcount) {
		case 3:
			await runAndWait(ns, "workforfaction.js", 0, SLUMSNAKES, FIELDWORK);
			await workForFactionUntil(ns, NITESEC, HACKING, 15000);
			await workForFactionUntil(ns, SLUMSNAKES, FIELDWORK, 1500);
			ns.spawn("purchase-augmentations.js", 1, SLUMSNAKES, NITESEC);
			break;
		case 4:
			await runAndWait(ns, "workforfaction.js", 0, SLUMSNAKES, FIELDWORK);
			await workForFactionUntil(ns, NITESEC, HACKING, 20000);
			await workForFactionUntil(ns, SLUMSNAKES, FIELDWORK, 5000);
			ns.spawn("purchase-augmentations.js", 1, SLUMSNAKES, NITESEC);
			break;
		case 5:
			await runAndWait(ns, "workforfaction.js", 0, SLUMSNAKES, FIELDWORK);
			await workForFactionUntil(ns, NITESEC, HACKING, 50000);
			await workForFactionUntil(ns, SLUMSNAKES, FIELDWORK, 22500);
			ns.spawn("purchase-augmentations.js", 1, SLUMSNAKES, NITESEC);
			break;
	}

	await writeProgram(ns, programs[2]);
	await startHacking(ns);
	await runAndWait(ns, "commit-crimes.js", 343); // hack level of I.I.I.I (Black Hand)
	await runAndWait(ns, "rscan.js", "hack");
	await runAndWait(ns, "rscan.js", "back");
	await runAndWait(ns, "workforfaction.js", 0, BLACKHAND, HACKING);
	await writeProgram(ns, programs[3]);
	await startHacking(ns);

	switch (bootcount) {
		case 6:
			await runAndWait(ns, "workforfaction.js", 0, SLUMSNAKES, FIELDWORK);
			await workForFactionUntil(ns, BLACKHAND, HACKING, 50000);
			await workForFactionUntil(ns, RUNNERS, HACKING, 100000);
			ns.spawn("purchase-augmentations.js", 1, BLACKHAND, RUNNERS, SLUMSNAKES);
			break;
		case 7:
			await workForFactionUntil(ns, BLACKHAND, HACKING, 100000);
			await workForFactionUntil(ns, RUNNERS, HACKING, 200000);
			ns.spawn("purchase-augmentations.js", 1, BLACKHAND, RUNNERS);
			break;
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
async function firstActions(ns, bootcount) {
	await runAndWait(ns, "start-hacknet.js", bootcount);
	// nuke and hack unprotected hosts
	await startHacking(ns);
	// can't do anything usefull yet, so kill a few people
	await runAndWait(ns, "commit-crimes.js", programs[0].level);
	// start work on first program as soon as it becomes available
	await writeProgram(ns, programs[0]);
	// now use it
	await startHacking(ns);
	while (!ns.getServer("CSEC").backdoorInstalled) {
		await runAndWait(ns, "commit-crimes.js", 60);
		await runAndWait(ns, "rscan.js", "back");
		await ns.sleep(5000);
	}
	// if we are going to join CyberSec later on anyway, do it right now
	if (bootcount < 3) {
		await runAndWait(ns, "workforfaction.js", 1, CYBERSEC, HACKING);
	} else {
		// don't join unecessarily a faction
		await runAndWait(ns, "commit-crimes.js", programs[1].level);
	}

	// do the second program, too
	await writeProgram(ns, programs[1]);
	await startHacking(ns);
}

/** @param {NS} ns **/
async function workForFactionUntil(ns, faction, worktype, limit) {
	while (ns.getFactionRep(faction) < limit) {
		await runAndWait(ns, "workforfaction.js", limit, faction, worktype);
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

var programs = [
	{ name: "BruteSSH.exe", level: 50 },
	{ name: "FTPCrack.exe", level: 100 },
	{ name: "relaySMTP.exe", level: 250 },
	{ name: "HTTPWorm.exe", level: 500 },
	{ name: "SQLInject.exe", level: 750 }
];

/** @param {NS} ns **/
async function writeProgram(ns, program) {
	if (!ns.fileExists(program.name)) {
		await startProgrammingOn(ns, program);
		while (!ns.fileExists(program.name)) {
			await ns.sleep(60000);
		}
	}
}

/** @param {NS} ns **/
async function startProgrammingOn(ns, program) {
	while (ns.getHackingLevel() < program.level) {
		await ns.sleep(60000);
	}
	ns.createProgram(program.name, true);
}