/** @param {NS} ns **/
export async function main(ns) {
	var target = ns.args[0];

	ns.tprintf("Total ways to sum to %d: %d", target, totalWaysToSum(target));
}

export function totalWaysToSum(target) {
	return waysFor(target, target - 1);
}

function waysFor(k, n) {
	if (k <= 1) return 1;
	if (n <= 1) return 1;
	if (n > k) return waysFor(k, k);
	return waysFor(k, n - 1) + waysFor(k - n, n);
}