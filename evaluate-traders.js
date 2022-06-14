import { formatMoney } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["start", false],["stop",false],["report",false],["algo", "avg"]]);
	const startBudget = 500e6;
	const minIdx = 8;
	const maxIdx = 12;
	if (options.start) {
	for (var ii = minIdx ; ii<=maxIdx; ii++) {
		const size = 2*ii;
		const lockFile = fileName(ns, "lock", size, options.algo);
		const valuationFile = fileName(ns, "val", size, options.algo);
		await ns.write(lockFile, JSON.stringify(startBudget), "w");
		ns.run("trader.js", 1, "--size", size,
			"--lockFile", lockFile, "--valuationFile", valuationFile, "--algo", options.algo);
	}
	}
	if (options.report) {
		var bestIdx = 0;
		var bestValue = 0;
		for (var ii = minIdx ; ii<=maxIdx; ii++) {
			const size = 2*ii;
			const lockFile = fileName(ns, "lock", size, options.algo);
			const valuationFile = fileName(ns, "val", size, options.algo);
			const value = JSON.parse(ns.read(valuationFile));
			ns.tprintf("trader-%d valuation: %s", ii*2, formatMoney(value));
			if (value>bestValue) {
				bestValue = value;
				bestIdx = ii;
			}
		}
		ns.tprintf("Best trader size is %d, value %s", bestIdx*2, formatMoney(bestValue));
	}
	if (options.stop) {
	for (var ii = minIdx ; ii<=maxIdx; ii++) {
		const size = 2*ii;
		const lockFile = fileName(ns, "lock", size, options.algo);
		const valuationFile = fileName(ns, "val", size, options.algo);
		ns.rm(lockFile);
	}
	await ns.sleep(6000);
	for (var ii = minIdx ; ii<=maxIdx; ii++) {
		const size = 2*ii;
		const lockFile = fileName(ns, "lock", size, options.algo);
		const valuationFile = fileName(ns, "val", size, options.algo);
		ns.rm(valuationFile);
	}
	}
}

function fileName(ns, type, size, algo) {
	return "trader-" +type + "-" + algo + "-" + size + ".txt";
}