import { formatMoney } from "helpers.js";

const COMISSION = 100e3;
const RE_INVEST_QUOTE = 0.5;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	const options = ns.flags([
		["size", 24],
		["lockFile", "reserved-money.txt"]]);
	const budget = JSON.parse(ns.read(options.lockFile));

	if (budget < 100e6) {
		ns.tprintf("Budget for trading too small (%s, need %s)",
			formatMoney(budget), formatMoney(100e6));
		return;
	}
	await writeLockFile(ns, options, budget);
	await trade(ns, options);
}

/** @param {NS} ns */
async function writeLockFile(ns, options, budget) {
	await ns.write(options.lockFile, budget, "w");
}

/** @param {NS} ns */
async function trade(ns, options) {
	const db = ns.stock.getSymbols().map(a => {
		return {
			symbl: a,
			prices: [ns.stock.getPrice(a)],
			shares: 0,
		}
	});
	for (var ii = 0; ii < options.size; ii++) {
		await updateStocks(ns, options, db);
		ns.tprintf("Collected %d of %d prices", ii + 1, options.size);
	}

	const portfolio = [];
	while (true) {
		const mostUp = db.map(a => stockUps(ns, a)).reduce((a, b) => a ? Math.max(a, b) : b);
		var rising = db.filter(a => stockUps(ns, a) == mostUp);
		// ns.printf("Most up is %d, by %s", mostUp, rising.map(a => a.symbl));
		await runTrades(ns, options, portfolio, rising);
		await updateStocks(ns, options, db);
	}
}

/** @param {NS} ns */
async function runTrades(ns, options, portfolio, rising) {
	var reserved = JSON.parse(ns.read(options.lockFile));
	for (var ii = 0; ii < portfolio.length; ii++) {
		const stk = portfolio[ii];
		const ups = stockUps(ns, stk);
		ns.printf("Holding %d shares of %s, tendency %d", stk.shares, stk.symbl, ups);
		if (ups < 0) {
			var sellPrice = ns.stock.sell(stk.symbl, stk.shares);
			var win = (sellPrice - stk.price) * stk.shares - 2 * COMISSION;
			ns.tprintf("Sold %d shares of %s at %s, win: %s",
				stk.shares, stk.symbl, formatMoney(sellPrice), formatMoney(win));
			reserved += (sellPrice * stk.shares - COMISSION);
			// re-invest a part of winnings
			reserved -= Math.max(0, win * RE_INVEST_QUOTE);
			ns.tprintf("Trader %d has %s", options.size, formatMoney(reserved));
			portfolio.splice(ii, 1);
			ii--;
		}
	}
	if (portfolio.length == 0 && rising.length > 0) {
		const stockToBuy = rising[0];
		const price = ns.stock.getPrice(stockToBuy.symbl);
		const money = reserved;
		var shares = Math.floor((money - 1e5) / price);
		while (ns.stock.getPurchaseCost(stockToBuy.symbl, shares, "Long") > money) {
			shares--;
		}
		var boughtPrice;
		while ((boughtPrice = ns.stock.buy(stockToBuy.symbl, shares)) == 0) {
			shares--;
		}
		ns.tprintf("Bought %d shares of %s at %s", shares, stockToBuy.symbl, formatMoney(boughtPrice));
		stockToBuy.shares = shares;
		stockToBuy.price = boughtPrice;
		portfolio.push(stockToBuy);
		reserved -= (stockToBuy.shares * stockToBuy.price + COMISSION);
		reserved = Math.max(0, reserved);
	}
	await writeLockFile(ns, options, reserved);
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
function stockUps(ns, stk) {
	const size = stk.prices.length;
	const avg = stk.prices.slice(0, size / 2).reduce((a, b) => a + b, 0) / (size / 2);
	const ups = stk.prices.slice(size / 2).reduce((a, b) => a + ((b > avg) ? +1 : -1), 0);
	// ns.tprintf("Avg of %s is %d, ups: %d", JSON.stringify(stk), avg, ups);
	return ups;
}