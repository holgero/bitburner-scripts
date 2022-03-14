/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) {
		usage(ns);
		return;
	}
	await solveContract(ns, ns.args[0], ns.args[1], JSON.parse(ns.args[2]));
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: run solve_contract2.js <server> <filename> <solution>...");
}

/** @param {NS} ns **/
async function solveContract(ns, server, filename, solution) {
	ns.tprintf("solution '%s' for contract '%s' on server '%s'", JSON.stringify(solution), filename, server);
	var result = ns.codingcontract.attempt(solution, filename, server, { returnReward: true });
	if (result == "") {
		ns.tprint("FAILED");
	} else {
		ns.tprintf("Success, reward: %s", result);
	}
}