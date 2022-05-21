/** @param {NS} ns **/
export async function main(ns) {
	const server = ns.args[0];
	const contract = ns.args[1];
	const type = ns.codingcontract.getContractType(contract, server);
	ns.spawn("solve_contract3.js", 1, server, contract, JSON.stringify(type));
}