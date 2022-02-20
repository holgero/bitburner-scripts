/** @param {NS} ns **/
export async function main(ns) {
	var program = programs[ns.args[0]];

	await writeProgram(ns, program);
}

var programs = [
	{ name: "BruteSSH.exe", level: 50, cost: 500000 },
	{ name: "FTPCrack.exe", level: 100, cost: 1500000 },
	{ name: "relaySMTP.exe", level: 250, cost: 5000000 },
	{ name: "HTTPWorm.exe", level: 500, cost: 30000000 },
	{ name: "SQLInject.exe", level: 750, cost: 250000000 }
];

/** @param {NS} ns **/
async function writeProgram(ns, program) {
	while (!ns.fileExists(program.name)) {
		while (ns.getHackingLevel() < program.level) {
			if (tryToBuyProgram(ns, program)) return;
			await ns.sleep(60000);
		}
		if (tryToBuyProgram(ns, program)) return;
		ns.createProgram(program.name, true);
		await ns.sleep(60000);
	}
}

function tryToBuyProgram(ns, program) {
	if (ns.getPlayer().tor && ns.getServerMoneyAvailable("home") > program.cost) {
		return ns.purchaseProgram(program.name);
	} else {
		if (ns.getServerMoneyAvailable("home") > program.cost + 200000) {
			ns.purchaseTor();
			return ns.purchaseProgram(program.name);
		}
	}
}