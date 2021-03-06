import * as c from "./constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var lowStatName = ns.args[0];
	var focus = ns.args[1];
	if (ns.gymWorkout("Powerhouse Gym", lowStatName, focus) ||
		ns.gymWorkout("Snap Fitness Gym", lowStatName, focus) ||
		ns.gymWorkout("Millenium Fitness Gym", lowStatName, focus)) {
		await ns.sleep(60000);
	} else {
		ns.travelToCity(c.SECTOR12);
		if (!ns.gymWorkout("Powerhouse Gym", lowStatName, focus)) {
			ns.spawn("commit-crimes.js", 1, "--timed", 60);
		}
	}
	return;
}