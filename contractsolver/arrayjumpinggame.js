/** @param {NS} ns **/
export async function main(ns) {
	var distances = JSON.parse(ns.args[0]);
	var result = arrayJumpingGame(distances);
	ns.tprintf("Result: %d", result);
}

export function arrayJumpingGame(distances) {
	var maxDistance = distances[0];
	for (var ii = 1; ii < maxDistance; ii++) {
		maxDistance = Math.max(maxDistance, ii + distances[ii]);
		if (maxDistance > distances.length) {
			return 1;
		}
	}
	return 0;
}