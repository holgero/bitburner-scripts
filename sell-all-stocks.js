import { deleteBudget } from "budget.js";

/** @param {NS} ns **/
export async function main(ns) {
	for (var sym of ns.stock.getSymbols()) {
		var have = ns.stock.getPosition(sym);
		if (have[0] > 0) ns.stock.sellStock(sym, have[0]);
		if (have[2] > 0) ns.stock.sellShort(sym, have[2]);
	}
	if (!deleteBudget(ns, "stocks")) {
		ns.tprintf("Failed to delete budget for %s", "stocks");
	}
}