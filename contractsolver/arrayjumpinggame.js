/** @param {NS} ns **/
export async function main(ns) {
	var distances = JSON.parse(ns.args[0]);
	var result = arrayJumpingGame2(distances);
	ns.tprintf("Result: %d", result);
}

export function arrayJumpingGame(distances) {
	var maxDistance = distances[0];
	for (var ii = 1; ii <= maxDistance; ii++) {
		maxDistance = Math.max(maxDistance, ii + distances[ii]);
		if (maxDistance >= distances.length) {
			return 1;
		}
	}
	return 0;
}

export function arrayJumpingGame2(distances) {
	var maxDistance = distances[0];
	if (maxDistance >= distances.length - 1) {
		return 1;
	}
	var minJumps = 1e9;
	for (var ii = 1; ii <= maxDistance; ii++) {
		const remainingJumps = arrayJumpingGame2(distances.slice(ii));
		if (remainingJumps > 0) {
			minJumps = Math.min(minJumps, remainingJumps);
		}
	}
	if (minJumps < 1e9) {
		return minJumps + 1;
	}
	return 0;
}