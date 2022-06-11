const PRICE_SIZE = 20;
/** @param {NS} ns */
export async function main(ns) {
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

	const portfolio = [];
	while (true) {
		const mostUp = db.map(a => stockUps(ns, a)).reduce((a, b) => a ? Math.max(a, b) : b);
		var rising = db.filter(a => stockUps(ns, a) == mostUp);
		ns.printf("Most up is %d, by %s", mostUp, rising.map(a => a.symbl));
		runTrades(ns, portfolio, rising);
		await ns.sleep(6000);
		updateStocks(ns, db);
	}
}

/** @param {NS} ns */
function runTrades(ns, portfolio, rising) {
	for (var ii = 0; ii < portfolio.length; ii++) {
		const stk = portfolio[ii];
		const ups = stockUps(ns, stk);
		ns.printf("Holding %d shares of %s, at %s, tendency %d", stk.shares, stk.symbl,
			ns.stock.getBidPrice(stk.symbl), ups);
		if (ups < 0) {
			ns.stock.sell(stk.symbl, stk.shares);
			ns.tprintf("Sold %d shares of %s", stk.shares, stk.symbl);
			portfolio.splice(ii, 1);
			ii--;
		}
	}
	if (portfolio.length == 0 && rising.length > 0) {
		const stockToBuy = rising[0];
		const price = ns.stock.getAskPrice(stockToBuy.symbl);
		const money = 0.9 * ns.getServerMoneyAvailable("home");
		var shares = Math.floor((money - 1e5) / price);
		while (ns.stock.getPurchaseCost(stockToBuy.symbl, shares, "Long") > money) {
			shares--;
		}
		while (ns.stock.buy(stockToBuy.symbl, shares) == 0) {
			shares--;
		}
		ns.tprintf("Bought %d shares of %s", shares, stockToBuy.symbl);
		stockToBuy.shares = shares;
		portfolio.push(stockToBuy);
	}
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