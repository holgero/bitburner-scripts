/** @param {NS} ns **/
export async function main(ns) {
	var lowStatName = ns.args[0];
	if (ns.gymWorkout("Powerhouse Gym", lowStatName) ||
		ns.gymWorkout("Snap Fitness Gym", lowStatName) ||
		ns.gymWorkout("Millenium Fitness Gym", lowStatName)) {
		await ns.sleep(60000);
	}
	return;
}