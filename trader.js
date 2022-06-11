import { formatMoney, getAvailableMoney } from "helpers.js";

const PRICE_SIZE = 20;
const COMISSION = 100e3;
const RE_INVEST_QUOTE = 0.5;
const portfolio = [];

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");

	await ns.write("reserved-money.txt", JSON.stringify(getAvailableMoney(ns, true)), "w");
	ns.atExit(function () {
		for (var stk of portfolio) {
			ns.stock.sell(stk.symbl, stk.shares);
		}
	});
	await trade(ns);
}

/** @param {NS} ns */
async function trade(ns) {
	const db = ns.stock.getSymbols().map(a => {
		return {
			symbl: a,
			prices: [ns.stock.getPrice(a)],
			shares: 0,
		}
	});
	for (var ii = 0; ii < PRICE_SIZE; ii++) {
		await ns.sleep(6000);
		updateStocks(ns, db);
		ns.tprintf("Collected %d of %d prices", ii + 1, PRICE_SIZE);
	}

	while (true) {
		const mostUp = db.map(a => stockUps(ns, a)).reduce((a, b) => a ? Math.max(a, b) : b);
		var rising = db.filter(a => stockUps(ns, a) == mostUp);
		ns.printf("Most up is %d, by %s", mostUp, rising.map(a => a.symbl));
		await runTrades(ns, portfolio, rising);
		await ns.sleep(6000);
		updateStocks(ns, db);
	}
}

/** @param {NS} ns */
async function runTrades(ns, portfolio, rising) {
	var reserved = JSON.parse(ns.read("reserved-money.txt"));
	for (var ii = 0; ii < portfolio.length; ii++) {
		const stk = portfolio[ii];
		const ups = stockUps(ns, stk);
		ns.printf("Holding %d shares of %s, tendency %d", stk.shares, stk.symbl, ups);
		if (ups < 0) {
			var sellPrice = ns.stock.sell(stk.symbl, stk.shares);
			var win = (sellPrice - stk.price) * stk.shares - 2 * COMISSION;
			ns.tprintf("Sold %d shares of %s at %s, win: %s",
				stk.shares, stk.symbl, formatMoney(sellPrice), formatMoney(win));
			reserved += stk.price * stk.shares + COMISSION;
			// re-invest a part of winnings
			reserved += Math.max(0, win * RE_INVEST_QUOTE);
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
	await ns.write("reserved-money.txt", JSON.stringify(reserved), "w");
}

/** @param {NS} ns */
function updateStocks(ns, db) {
	for (var stk of db) {
		const price = ns.stock.getPrice(stk.symbl);
		stk.prices.push(price);
		while (stk.prices.length > PRICE_SIZE) {
			stk.prices.shift();
		}
	}
}

/** @param {NS} ns */
function stockUps(ns, stk) {
	const avg = stk.prices.slice(0, PRICE_SIZE / 2).reduce((a, b) => a + b, 0) / (PRICE_SIZE / 2);
	const ups = stk.prices.slice(PRICE_SIZE / 2).reduce((a, b) => a + ((b > avg) ? +1 : -1), 0);
	// ns.tprintf("Avg of %s is %d, ups: %d", JSON.stringify(stk), avg, ups);
	return ups;
}