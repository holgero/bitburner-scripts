/** @param {NS} ns **/
export async function main(ns) {
	const contracts = JSON.parse(ns.read("contracts.txt"));
	for (var contract of contracts) {
		contract.data = ns.codingcontract.getData(contract.file, contract.server);
	}
	await ns.write("contracts.txt", JSON.stringify(contracts), "w");
}