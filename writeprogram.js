import { programs } from "constants.js";
import { getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var program = programs[ns.args[0]];

	if (!ns.fileExists(program.name)) {
		if (tryToBuyProgram(ns, program)) {
			 return;
		}
		const current = ns.singularity.getCurrentWork();
		if (current != null &&
			current.type == "CREATE_PROGRAM" && current.programName == program.name) {
			ns.printf("Already coding %s", current.programName);
			return;
		}
		ns.singularity.createProgram(program.name, true);
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