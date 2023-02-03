import { formatMoney } from "helpers.js";
import {
	getBudget,
	setHolding,
	useBudget,
	unuseBudget,
	releaseBudget,
	deleteBudget,
} from "budget.js";

const COMISSION = 100e3;
const DIVIDEND = 0.2;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	const options = ns.flags([
		["size", 24],
		["budgetName", "stocks"],
		["valuationFile", ""],
		["algo", "count"]]);
	const budget = getBudget(ns, options.budgetName);
	if (budget < 100e6) {
		ns.tprintf("Budget for trading too small (%s, need %s)",
			formatMoney(budget), formatMoney(100e6));
		deleteBudget(ns, "stocks");
		return;
	}
	switch (options.algo) {
		case "count":
			options.stockUps = stockUpsCount;
			break;
		case "avg":
			options.stockUps = stockUpsAvg;
			break;
	}
	await trade(ns, options);
}

/** @param {NS} ns */
async function trade(ns, options) {
	const db = ns.stock.getSymbols().map(a => {
		return {
			symbl: a,
			prices: [ns.stock.getPrice(a)],
			shares: 0,
			cost: 0,
		}
	});
	for (var ii = 0; ii < options.size; ii++) {
		await updateStocks(ns, options, db);
		ns.printf("Collected %d of %d prices", ii + 1, options.size);
	}
	const portfolio = [];

	while (true) {
		const mostUp = db.map(a => options.stockUps(ns, a)).reduce((a, b) => a ? Math.max(a, b) : b);
		var rising = db.filter(a => options.stockUps(ns, a) == mostUp);
		ns.printf("Most up is %s, by %s", mostUp, rising.map(a => a.symbl));
		await runTrades(ns, options, portfolio, rising);
		await updateStocks(ns, options, db);
	}
}

/** @param {NS} ns */
async function runTrades(ns, options, portfolio, rising) {
	var valuation = 0;
	for (var ii = 0; ii < portfolio.length; ii++) {
		const stk = portfolio[ii];
		const ups = options.stockUps(ns, stk);
		if (ups < 0) {
			const sellPrice = ns.stock.sellStock(stk.symbl, stk.shares);
			const gainedMoney = sellPrice * stk.shares - COMISSION;
			unuseBudget(ns, options.budgetName, gainedMoney);
			const win = gainedMoney - stk.cost;
			ns.printf("Sold %d shares of %s for %s (%s per share), win: %s",
				stk.shares, stk.symbl, formatMoney(gainedMoney),
				formatMoney(sellPrice), formatMoney(win));
			stk.shares = 0;
			stk.cost = 0;
			// distribute a part of the winnings
			releaseBudget(ns, options.budgetName, Math.max(0, win * DIVIDEND));
			portfolio.splice(ii, 1);
			ii--;
		} else {
			valuation += stk.shares * stk.prices[stk.prices.length - 1];
		}
		// ns.printf("Holding %d shares of %s, tendency %d", stk.shares, stk.symbl, ups);
	}
	setHolding(ns, options.budgetName, valuation);
	ns.printf("Trader%d valuation: %s", options.size, formatMoney(valuation));
	if (options.valuationFile) {
		ns.write(options.valuationFile, valuation + getBudget(ns, options.budgetName), "w");
	}
	while (rising.length > 0 && getBudget(ns, options.budgetName) > 100 * COMISSION) {
		const stockToBuy = rising.shift();
		const price = ns.stock.getPrice(stockToBuy.symbl);
		const money = Math.min(ns.getServerMoneyAvailable("home"), getBudget(ns, options.budgetName));
		if (money < 100 * COMISSION) {
			break;
		}
		// buy at most half of the shares of one specific stock
		// and only up to a million shares at once
		var shares = Math.min(Math.floor((money - COMISSION) / price),
			ns.stock.getMaxShares(stockToBuy.symbl) / 2 - stockToBuy.shares);
		shares = Math.min(1e6, shares);
		var boughtPrice;
		while (shares > 0 && (boughtPrice = ns.stock.buyStock(stockToBuy.symbl, shares)) == 0) {
			shares--;
		}
		if (shares <= 0) {
			continue;
		}
		const moneySpent = boughtPrice * shares + COMISSION;
		if (!useBudget(ns, options.budgetName, moneySpent)) {
			ns.printf("Failed to use budget");
			break;
		}
		ns.printf("Bought %d shares of %s at %s", shares, stockToBuy.symbl, formatMoney(boughtPrice));
		stockToBuy.cost += moneySpent;
		stockToBuy.shares += shares;
		if (!portfolio.find(a => a.symbl == stockToBuy.symbl)) {
			portfolio.push(stockToBuy);
		}
		await ns.sleep(100);
	}
}

/** @param {NS} ns */
async function updateStocks(ns, options, db) {
	var count = 0;
	while (true) {
		await ns.sleep(2000);
		var changed = false;
		for (var stk of db) {
			const price = ns.stock.getPrice(stk.symbl);
			if (stk.prices[stk.prices.length - 1] != price) {
				// ns.printf("Price change %d -> %d for stock %s", stk.prices[stk.prices.length - 1], price, stk.symbl);
				changed = true;
				break;
			}
		}
		if (changed) break;
		count++;
	}
	// ns.printf("Price change after %d seconds", 2 * count);
	for (var stk of db) {
		const price = ns.stock.getPrice(stk.symbl);
		stk.prices.push(price);
		while (stk.prices.length > options.size) {
			stk.prices.shift();
		}
	}
}

/** @param {NS} ns */
function stockUpsAvg(ns, stk) {
	const size = stk.prices.length;
	const oldAvg = stk.prices.slice(0, size / 2).reduce((a, b) => a + b, 0) / (size / 2);
	const newAvg = stk.prices.slice(size / 2).reduce((a, b) => a + b, 0) / (size / 2);

	return (newAvg - oldAvg) / oldAvg;
}

/** @param {NS} ns */
function stockUpsCount(ns, stk) {
	const size = stk.prices.length;
	const avg = stk.prices.slice(0, size / 2).reduce((a, b) => a + b, 0) / (size / 2);
	const ups = stk.prices.slice(size / 2).reduce((a, b) => a + ((b > avg) ? +1 : -1), 0);

	return ups;
}