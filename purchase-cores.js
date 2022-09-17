import { getAvailableMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["reserve", 0], ["unlimited", false]]);
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