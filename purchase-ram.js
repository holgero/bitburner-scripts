import { getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var goal = +ns.args[0];
	while (ns.getServerMaxRam("home") < goal && 
			ns.getUpgradeHomeRamCost() < getAvailableMoney(ns)) {
		if (!ns.upgradeHomeRam()) break;
	}
	ns.tprintf("Home server ram: %d GB", ns.getServerMaxRam("home"));
}