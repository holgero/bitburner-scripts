/** @param {NS} ns */
export async function main(ns) {
	ns.stock.purchaseWseAccount();
	ns.stock.purchaseTixApi();
	ns.stock.purchase4SMarketData();
	ns.stock.purchase4SMarketDataTixApi();
}