import { formatMoney, getCorporationInfo } from "./helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const corporationInfo = getCorporationInfo(ns);
	if (!corporationInfo.name) {
		ns.tprintf("No corporation");
		return;
	}
	const valuePerShare = corporationInfo.valuation / corporationInfo.totalShares;
	const low = 0.5 * valuePerShare;
	const high = 1.5 * valuePerShare;
	const profit = corporationInfo.revenue - corporationInfo.expenses;

	ns.tprintf("Corporation %s: share=%s (%s-%s), funds=%s, profit=%s, cool=%d s, bonus time=%d s, owned=%s",
		corporationInfo.name,
		formatMoney(corporationInfo.sharePrice), formatMoney(low), formatMoney(high),
		formatMoney(corporationInfo.funds),
		formatMoney(profit),
		Math.ceil(corporationInfo.shareSaleCooldown / 5),
		Math.ceil(corporationInfo.bonusTime / 1000),
		corporationInfo.issuedShares == 0 ? "*" : "-");
}