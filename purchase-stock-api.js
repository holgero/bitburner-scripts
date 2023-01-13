/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["all", false]]);
	if (!ns.stock.purchaseWseAccount()) return;
	if (!ns.stock.purchaseTixApi()) return;
	if (!options.all) return;
	if (!ns.stock.purchase4SMarketData()) return;
	if (!ns.stock.purchase4SMarketDataTixApi()) return;
}