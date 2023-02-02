import { formatMoney } from "helpers.js";
import {
	getBudget,
	setHolding,
	useBudget,
	unuseBudget,
	releaseBudget,
} from "budget.js";

const COMISSION = 100e3;
const DIVIDEND = 0.2;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	const options = ns.flags([
		["budgetName", "stocks"],
		["valuationFile", ""]]);
	const budget = getBudget(ns, options.budgetName);
	if (budget < 100e6) {
		ns.tprintf("Budget for trading too small (%s, need %s)",
			formatMoney(budget), formatMoney(100e6));
		return;
	}
	await trade(ns, options);
}

/** @param {NS} ns */
async function trade(ns, options) {
	const db = ns.stock.getSymbols().map(a => {
		return {
			symbl: a,
			price: ns.stock.getPrice(a),
			shares: 0,
			cost: 0,
		}
	});
	const portfolio = [];

	while (true) {
		var rising = db.filter(a => ns.stock.getForecast(a.symbl) > 0.5);
		rising.sort((a, b) => ns.stock.getForecast(a.symbl) - ns.stock.getForecast(b.symbl));
		rising.reverse();
		ns.printf("Best forecast has %s with %s", rising[0].symbl, ns.stock.getForecast(rising[0].symbl).toFixed(2));
		await runTrades(ns, options, portfolio, rising);
		await updateStocks(ns, options, db);
	}
}

/** @param {NS} ns */
async function runTrades(ns, options, portfolio, rising) {
	var valuation = 0;
	for (var ii = 0; ii < portfolio.length; ii++) {
		const stk = portfolio[ii];
		if (ns.stock.getForecast(stk.symbl) < 0.5) {
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
			valuation += stk.shares * stk.price;
		}
		// ns.printf("Holding %d shares of %s", stk.shares, stk.symbl);
	}
	setHolding(ns, options.budgetName, valuation);
	ns.printf("Trader valuation: %s, portfolio: %s", formatMoney(valuation), portfolio.map(a=>a.symbl));
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
	while (true) {
		await ns.sleep(900);
		var changed = false;
		for (var stk of db) {
			const price = ns.stock.getPrice(stk.symbl);
			if (stk.price != price) {
				changed = true;
				break;
			}
		}
		if (changed) break;
	}
	for (var stk of db) {
		const price = ns.stock.getPrice(stk.symbl);
		stk.price = price;
	}
}