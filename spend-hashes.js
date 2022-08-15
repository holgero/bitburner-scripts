const money = "Sell for Money";
const blade_rank = "Exchange for Bladeburner Rank";
const blade_skill = "Exchange for Bladeburner SP";
const corp_money = "Sell for Corporation Funds";
const corp_research = "Exchange for Corporation Research";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["all", false]]);
	for (var upgName of [blade_rank, blade_skill, corp_money, corp_research]) {
		await spendOn(ns, upgName);
	}
	if (options.all || ns.hacknet.numHashes() > 0.75 * ns.hacknet.hashCapacity()) {
		await spendOn(ns, money);
	}
}

async function spendOn(ns, upgName) {
	while (ns.hacknet.numHashes() > ns.hacknet.hashCost(upgName)) {
		if (!ns.hacknet.spendHashes(upgName)) {
			break;
		}
		ns.printf("Spent hashes on %s", upgName);
	}
}