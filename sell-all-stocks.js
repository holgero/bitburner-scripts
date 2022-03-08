/** @param {NS} ns **/
export async function main(ns) {
	for (var sym of ns.stock.getSymbols()) {
		var have = ns.stock.getPosition(sym);
		if (have[0] > 0) ns.stock.sell(sym, have[0]);
		if (have[2] > 0) ns.stock.sellShort(sym, have[2]);
	}
}