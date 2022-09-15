import * as c from "./constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	var lowStatName = ns.args[0];
	var focus = ns.args[1];
	if (ns.singularity.gymWorkout("Powerhouse Gym", lowStatName, focus) ||
		ns.singularity.gymWorkout("Snap Fitness Gym", lowStatName, focus) ||
		ns.singularity.gymWorkout("Millenium Fitness Gym", lowStatName, focus)) {
		return;
	}
	ns.singularity.travelToCity(c.SECTOR12);
	ns.singularity.gymWorkout("Powerhouse Gym", lowStatName, focus);
}