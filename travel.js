import * as c from "./constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["city", ""]]);
	if (options.city && c.CITIES.includes(options.city)) {
		if (ns.getPlayer().city != options.city) {
			ns.travelToCity(options.city);
		}
	}
}