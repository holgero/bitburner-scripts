/** @param {NS} ns **/
export async function main(ns) {
	const contracts = JSON.parse(ns.read("contracts.txt"));
	for (var contract of contracts) {
		if (contract.type == "Square Root") {
			contract.data = ns.codingcontract.getData(contract.file, contract.server).toString();
		} else {
			contract.data = ns.codingcontract.getData(contract.file, contract.server);
		}
	}
	await ns.write("contracts.txt", JSON.stringify(contracts), "w");
}