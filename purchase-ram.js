import { getAvailableMoney, getRestrictions } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["goal", 0], ["reserve", 0], ["unlimited", false]]);
	const restrictions = getRestrictions(ns);
	if (restrictions) {
		if (restrictions.maxram) {
			if (options.unlimited) {
				options.goal = restrictions.maxram;
				options.unlimited = false;
			} else {
				options.goal = Math.min(options.goal, restrictions.maxram);
			}
		}
	}
	var upgraded = false;
	while (options.unlimited ||
		(ns.getServerMaxRam("home") < options.goal &&
			ns.singularity.getUpgradeHomeRamCost() < getAvailableMoney(ns) - options.reserve)) {
		if (ns.singularity.upgradeHomeRam()) {
			upgraded = true;
		} else {
			break;
		}
	}
	if (upgraded) {
		ns.tprintf("Home server ram: %d GB", ns.getServerMaxRam("home"));
	}
}