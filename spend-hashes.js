/** @param {NS} ns */
export async function main(ns) {
	while (ns.hacknet.numHashes() > ns.hacknet.hashCost("Sell for Money")) {
		ns.hacknet.spendHashes("Sell for Money");
	}
}