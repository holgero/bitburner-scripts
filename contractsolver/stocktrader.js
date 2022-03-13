/** @param {NS} ns **/
export async function main(ns) {
	var transactions = ns.args[0];
	var prices = JSON.parse(ns.args[1]);

	switch (transactions) {
		case 1:
			ns.tprintf("Stock trader 1: %d", stockTraderI(prices));
			break;
		case 2:
			ns.tprintf("Stock trader 3: %d", stockTraderIII(prices));
			break;
		case 99:
			ns.tprintf("Stock trader 2: %d", stockTraderII(prices));
			break;
		default:
			ns.tprintf("Stock trader 4: %d", stockTraderIV(ns, transactions, prices));
			break;
	}
}

function compactPrices(prices) {
	var result = [];
	var current = prices[0];
	var falling = true;
	for (var price of prices) {
		if (falling) {
			if (price > current) {
				result.push(current);
				falling = false;
			}
		} else {
			if (price < current) {
				result.push(current);
				falling = true;
			}
		}
		current = price;
	}
	if (!falling) {
		result.push(current);
	}
	return result;
}

function bestSingleTransaction(prices) {
	var best = 0;
	var lowest = prices[0];
	for (var ii = 0; ii < prices.length; ii++) {
		if (prices[ii] < lowest) {
			lowest = prices[ii];
		}
		var delta = prices[ii + 1] - lowest;
		if (delta > best) best = delta;
	}

	return best;
}

export function stockTraderI(prices) {
	var compact = compactPrices(prices);
	return bestSingleTransaction(compact);
}

export function stockTraderII(prices) {
	var compact = compactPrices(prices);
	var sum = 0;
	for (var ii = 0; ii < compact.length; ii += 2) {
		sum += compact[ii + 1] - compact[ii];
	}
	return sum;
}

export function stockTraderIII(prices) {
	var compact = compactPrices(prices);
	var best = 0;
	for (var divider = 2; divider <= compact.length - 2; divider += 2) {
		var bestFirst = bestSingleTransaction(compact.slice(0, divider));
		var bestSecond = bestSingleTransaction(compact.slice(divider));
		if (bestFirst + bestSecond > best) {
			best = bestFirst + bestSecond;
		}
	}
	if (best > 0) {
		return best;
	}
	return stockTraderI(prices);
}

export function stockTraderIV(ns, transactions, prices) {
	switch (transactions) {
		case 1:
			return stockTraderI(prices);
		case 2:
			return stockTraderIII(prices);
	}

	var compact = compactPrices(prices);
	ns.tprintf("Compact: %s", JSON.stringify(compact));
	if (compact.length / 2 <= transactions) {
		return stockTraderII(prices);
	}
	var deltas = [];
	for (var ii = 0; ii < compact.length; ii += 2) {
		deltas.push(compact[ii + 1] - compact[ii]);
	}
	ns.tprintf("Deltas: %s", JSON.stringify(deltas));

	return -1;
}