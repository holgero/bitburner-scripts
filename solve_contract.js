import { runAndWait } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["auto", false]]);
	const known = ["home"];
	const contracts = [];
	collectContracts(ns, "home", known, contracts);
	if (contracts.length) {
		await resolveContractData(ns, contracts);
		if (options.auto) {
			solveContracts(ns, contracts);
		} else {
			printContracts(ns, contracts);
		}
	}
}

/** @param {NS} ns **/
function collectContracts(ns, startServer, known, contracts) {
	addServerContracts(ns, startServer, contracts);
	const servers = ns.scan(startServer).filter(a => !known.includes(a));
	known.push(...servers);
	for (var server of servers) {
		collectContracts(ns, server, known, contracts);
	}
}

/** @param {NS} ns **/
function addServerContracts(ns, server, contracts) {
	for (var file of ns.ls(server, ".cct")) {
		contracts.push({ server: server, file: file });
	}
}

/** @param {NS} ns **/
function printContracts(ns, contracts) {
	for (var contract of contracts) {
		ns.tprintf("%s (%s on %s): %s", contract.type, contract.file, contract.server,
			JSON.stringify(contract.data).substring(0, 20) + "...");
	}
}

/** @param {NS} ns **/
function solveContracts(ns, contracts) {
	ns.spawn("solve_contract4.js");
}

/** @param {NS} ns **/
async function resolveContractData(ns, contracts) {
	await ns.write("contracts.txt", JSON.stringify(contracts), "w");
	await runAndWait(ns, "solve_contract2.js");
	await runAndWait(ns, "solve_contract3.js");
	const resolved = JSON.parse(ns.read("contracts.txt"));
	contracts.splice(0, contracts.length);
	contracts.push(...resolved);
}