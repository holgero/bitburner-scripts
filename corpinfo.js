import { formatMoney } from "./helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	var corporationInfo = JSON.parse(ns.read("corporation.txt"));
	var low = corporationInfo.valuation / (2 * corporationInfo.totalShares);
	var high = corporationInfo.valuation / (2 * (corporationInfo.totalShares -
		corporationInfo.issuedShares - corporationInfo.numShares));
	var profit = corporationInfo.revenue - corporationInfo.expenses;

	ns.tprintf("Corporation: share=%s (%s-%s), funds=%s, profit=%s, cool=%d s, bonus time=%d s, owned=%s",
		formatMoney(corporationInfo.sharePrice), formatMoney(low), formatMoney(high),
		formatMoney(corporationInfo.funds),
		formatMoney(profit),
		Math.ceil(corporationInfo.shareSaleCooldown / 5),
		Math.ceil(corporationInfo.bonusTime/1000),
		corporationInfo.issuedShares == 0 ? "*" : "-");
}