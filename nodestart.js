import * as c from "constants.js";
import { runAndWait } from "helpers.js";

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
			ns.run("corporation.js");
		}
	}

	if (!ns.scriptRunning("factiongoals.js", "home")) {
		ns.run("factiongoals.js", 1, ...ns.args);
	}

	// use remaining memory on home machine for hacking foodnstuff
	if (!ns.scriptRunning("instrument.js", "home")) {
		ns.run("instrument.js", 1, "--target", "foodnstuff");
	}

	await runAndWait(ns, "start-hacknet.js", 1);
	await progressHackingLevels(ns);
}

/** @param {NS} ns **/
async function progressHackingLevels(ns) {
	var nextProgram = 0;
	var hacknetLevel = 8;
	while (true) {
		if (nextProgram < c.programs.length && ns.fileExists(c.programs[nextProgram].name)) {
			while (nextProgram < c.programs.length && ns.fileExists(c.programs[nextProgram].name)) {
				nextProgram++;
			}
			await startHacking(ns);
		}
		var currentMoney = ns.getServerMoneyAvailable("home");
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
			if (hacknetLevel < 9) {
				await runAndWait(ns, "start-hacknet.js", hacknetLevel++);
			}
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
		// check for coding contracts
		await runAndWait(ns, "solve_contract.js", "auto");
		await ns.sleep(30000);
	}
}

/** @param {NS} ns **/
async function startHacking(ns) {
	await runAndWait(ns, "rscan.js", "nuke", "--quiet");
	await runAndWait(ns, "rscan.js", "hack", "--quiet");
}