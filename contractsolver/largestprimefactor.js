/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("%d", largestPrimeFactor(ns.args[0]));
}

export function largestPrimeFactor(n) {
	if (n<2) return 1;
	while ( n % 2 == 0) {
		n = Math.round(n/2);
	}
	if (n == 1) {
		return 2;
	}
	for (var candidate = 3; candidate * candidate < n; candidate += 2) {
		while ( n % candidate == 0) {
			n = Math.round(n/candidate);
		}
	}
	return n;
}