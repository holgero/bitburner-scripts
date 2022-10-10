import * as c from "./constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "GRAFTING") {
		ns.printf("Currently grafting %s", current.augmentation);
		return;
	}

	var options = ns.flags([["city", ""]]);
	if (options.city && c.CITIES.includes(options.city)) {
		if (ns.getPlayer().city != options.city) {
			ns.singularity.travelToCity(options.city);
		}
	}
}