var start_company = "Joe's Guns";

/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("sleep");
	for (var ii=0; ii<programs.length; ii++) {
		await startHacking(ns);
		if (ii == 0) {
			startWorking(ns, start_company);
		} else {
			if (ii <= 2) {
				await runAndWait(ns, "workforfaction.js", "CyberSec", "Hacking Contracts");
			} else {
				await runAndWait(ns, "workforfaction.js", "Netburner", "Hacking Contracts");
			}
		}
		ns.run("start-hacknet.js");
		await writeProgram(ns, programs[ii]);
		ns.scriptKill("start-hacknet.js", "home");
		ns.scriptKill("start-hacknet2.js", "home");
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

/** @param {NS} ns **/
function startWorking(ns, company) {
	ns.applyToCompany(company, "Part-time Employee");
	ns.workForCompany(company, true);
}

var programs = [
		{ name: "BruteSSH.exe", level: 50 },
		{ name: "FTPCrack.exe", level: 100 },
		{ name: "relaySMTP.exe", level:  250 },
		{ name: "HTTPWorm.exe", level:  500 },
		{ name: "SQLInject.exe", level:  750 }
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