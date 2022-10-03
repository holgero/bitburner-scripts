import { formatMoney } from "./helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	for (var member of ns.gang.getMemberNames()) {
		const memberInfo = ns.gang.getMemberInformation(member);
		ns.tprintf("Member %s to ascend: %s", member,
			formatMoney(Math.max(5000, 2500 + memberInfo.hack_asc_points) - memberInfo.hack_exp));
	}
}