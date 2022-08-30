import { programs } from "constants.js";
import { getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var program = programs[ns.args[0]];

	await writeProgram(ns, program);
}

/** @param {NS} ns **/
async function writeProgram(ns, program) {
	while (!ns.fileExists(program.name)) {
		while (ns.getPlayer().skills.hacking < program.level) {
			if (tryToBuyProgram(ns, program)) return;
			await ns.sleep(60000);
		}
		if (tryToBuyProgram(ns, program)) return;
		ns.singularity.createProgram(program.name, true);
		await ns.sleep(60000);
	}
}

function tryToBuyProgram(ns, program) {
	if (ns.getPlayer().tor && getAvailableMoney(ns) > program.cost) {
		return ns.singularity.purchaseProgram(program.name);
	} else {
		if (getAvailableMoney(ns) > program.cost + 200000) {
			ns.singularity.purchaseTor();
			return ns.singularity.purchaseProgram(program.name);
		}
	}
}