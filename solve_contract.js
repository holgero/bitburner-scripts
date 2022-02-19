var known;

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) {
		usage(ns);
		return;
	}
	ns.disableLog("scan");
	known = ns.getPurchasedServers();
	known.push("home");
	if (ns.args[0] == "list") {
		await traverse(ns, "home", findContracts);
		return;
	}
	if (ns.args[0] == "solve") {
		await solveContract(ns, ns.args[1], ns.args[2]);
		return;
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: run solve_contract.js [list|solve] <server> <filename> <solution>...");
}

/** @param {NS} ns **/
async function traverse(ns, startServer, serverProc) {
	var servers = ns.scan(startServer);
	for (var i=0; i< servers.length; i++) {
		var server = servers[i];
		if (known.includes(servers[i])) {
			continue;
		}
		known.push(servers[i]);
		await serverProc(ns, server);
		await traverse(ns, server, serverProc);
	}
}

/** @param {NS} ns **/
async function findContracts(ns, server) {
	var contracts = ns.ls(server, ".cct");
	if (contracts.length > 0) {
		for (var contract of contracts) {
			ns.tprint(server + ": " + contract);
			ns.tprint(ns.codingcontract.getContractType(contract, server));
			ns.tprint(ns.codingcontract.getData(contract, server));
			// ns.tprint(ns.codingcontract.getDescription(contract, server));
			// ns.tprint(ns.codingcontract.getNumTriesRemaining(contract, server));
		}
	}
}

/** @param {NS} ns **/
async function solveContract(ns, server, filename) {
	var solution;
	if (ns.args.length == 4 && Number.isSafeInteger(ns.args[3])) {
		solution = +ns.args[3];
	} else {
		solution = ns.args.slice(3);
	}
	ns.tprintf("solution '%s' for contract '%s' on server '%s'", solution, filename, server);
	var result = ns.codingcontract.attempt(solution, filename, server, {returnReward:true});
	if (result == "") {
		ns.tprint("FAILED");
	} else {
		ns.tprintf("Success, reward: %s", result);
	}
}