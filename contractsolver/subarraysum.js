/** @param {NS} ns **/
export async function main(ns) {
	var array = JSON.parse(ns.args[0]);
	ns.tprintf("Subarry sum: %d", subarraySum(array));
}

export function subarraySum(array) {
	for (var ii=1; ii<array.length; ii++) {
		array[ii] = Math.max(array[ii], array[ii] + array[ii-1]);
	}
	var best = Number.MIN_SAFE_INTEGER;
	for (var value of array) {
		if (value > best) {
			best = value;
		}
	}

	return best;
}