/** @param {NS} ns **/
export async function main(ns) {
	var input = JSON.parse(ns.args[0]);
	var target = input[0];
	var numbers = input[1];

	ns.tprintf("Total ways to sum %s to %d: %d",
		JSON.stringify(numbers), target, totalWaysToSum2(target, numbers));
}

export function totalWaysToSum(target) {
	return waysFor(target, target - 1);
}

export function totalWaysToSum2(target, numbers) {
	if (numbers.length > 1) {
		var ways = 0;
		for (var ii = 0; ii <= target / numbers[numbers.length - 1]; ii++) {
			ways += totalWaysToSum2(target - ii * numbers[numbers.length - 1],
				numbers.slice(0, numbers.length - 1));
		}
		return ways;
	} else {
		if (target % numbers[0] == 0) {
			return 1;
		}
		return 0;
	}
}

function waysFor(k, n) {
	if (k <= 1) return 1;
	if (n <= 1) return 1;
	if (n > k) return waysFor(k, k);
	return waysFor(k, n - 1) + waysFor(k - n, n);
}