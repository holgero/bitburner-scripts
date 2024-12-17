/** @param {NS} ns **/
export async function main(ns) {
	let bigNumber = ns.args[0];
	let result = bigintSquare(bigNumber);
	ns.tprintf("Result: %s", result);
}

export function bigintSquare(bigString) {
	let n = BigInt(bigString);
	return roundedBigIntSqrt(n).toString();
}

function roundedBigIntSqrt(n) {
	return (bigIntSqrt(4n * n) + 1n) / 2n;
}

function bigIntSqrt(n) {
	if (n < 0n)
		throw RangeError("Square root of negative BigInt");
	if (n === 0n)
		return 0n;
	const w = BigInt(n.toString(2).length - 1);

	let x = 1n << (w >> 1n);  // x is the initial guess x0 here
	let next = (x + n / x) >> 1n;
	do {
		x = next;
	} while ((next = (x + n / x) >> 1n) < x);
	return x;
}
