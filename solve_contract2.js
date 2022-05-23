/** @param {NS} ns **/
export async function main(ns) {
	const contracts = JSON.parse(ns.read("contracts.txt"));
	contracts.forEach( a => a.type = ns.codingcontract.getContractType(a.file, a.server));
	await ns.write("contracts.txt", JSON.stringify(contracts), "w");
}