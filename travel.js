import * as c from "./constants.js";
import { canRunAction } from "./helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (!canRunAction(ns, "travel")) {
		ns.printf("Cannot travel at the moment");
		return;
	}

	var options = ns.flags([["city", ""]]);
	if (options.city && c.CITIES.includes(options.city)) {
		if (ns.getPlayer().city != options.city) {
			ns.singularity.travelToCity(options.city);
		}
	}
}