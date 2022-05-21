var known;

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) {
		usage(ns);
		return;
	}
	ns.disableLog("scan");
	known = [];
	known.push("home");
	if (ns.args[0] == "auto") {
		traverse(ns, "home", findAndSolveContracts);
		return;
	}
	if (ns.args[0] == "list") {
		traverse(ns, "home", findContracts);
		return;
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: run solve_contract.js [auto|list|solve] <server> <filename> <solution>...");
}

/** @param {NS} ns **/
function traverse(ns, startServer, serverProc) {
	var servers = ns.scan(startServer);
	for (var i = 0; i < servers.length; i++) {
		var server = servers[i];
		if (known.includes(servers[i])) {
			continue;
		}
		known.push(servers[i]);
		serverProc(ns, server);
		traverse(ns, server, serverProc);
	}
}

/** @param {NS} ns **/
function findAndSolveContracts(ns, server) {
	var contracts = ns.ls(server, ".cct");
	if (contracts.length &&
		!ns.scriptRunning("solve_contract2.js", "home") &&
		!ns.scriptRunning("solve_contract3.js", "home") &&
		!ns.scriptRunning("solve_contract4.js", "home")) {
		ns.spawn("solve_contract2.js", 1, server, contracts[0]);
	}
}

/** @param {NS} ns **/
function findContracts(ns, server) {
	var contracts = ns.ls(server, ".cct");
	if (contracts.length > 0) {
		for (var contract of contracts) {
			ns.tprint(server + " " + contract);
		}
	}
}