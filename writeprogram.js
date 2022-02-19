/** @param {NS} ns **/
export async function main(ns) {
	var program = programs[ns.args[0]];

	await writeProgram(ns, program);
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