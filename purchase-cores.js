import { getAvailableMoney, getRestrictions } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["reserve", 0], ["unlimited", false]]);
	const restrictions = getRestrictions(ns);
	if (restrictions) {
		if (restrictions.maxcore == 1) {
			ns.tprintf("Not installing home cores.");
			return;
		}
	}
	var installedCores = 0;
	while (options.unlimited ||
		(ns.singularity.getUpgradeHomeCoresCost() < getAvailableMoney(ns) - options.reserve)) {
		if (ns.singularity.upgradeHomeCores()) {
			installedCores++;
		} else {
			break;
		}
	}
	if (installedCores > 0) {
		ns.tprintf("Installed %d home cores.", installedCores);
	}
}