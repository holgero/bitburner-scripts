import { getAvailableMoney } from "helpers.js";
import * as c from "constants.js";

const money = "Sell for Money";
const blade_rank = "Exchange for Bladeburner Rank";
const blade_skill = "Exchange for Bladeburner SP";
const corp_money = "Sell for Corporation Funds";
const corp_research = "Exchange for Corporation Research";
const gym_training = "Improve Gym Training";
const uni = "Improve Studying";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["all", false], ["gym", false], ["uni", false]]);
	if (options.gym) {
		await spendOn(ns, gym_training);
	}
	if (options.uni) {
		await spendOn(ns, uni);
	}
	// spend one time on bladeburner rank to make it possible to join the faction
	if (ns.bladeburner.inBladeburner() && !ns.getPlayer().factions.includes(c.BLADEBURNERS)) {
		if (ns.hacknet.numHashes() < ns.hacknet.hashCost(blade_rank)
			|| !ns.hacknet.spendHashes(blade_rank)) {
			if (ns.hacknet.numHashes() < 0.99 * ns.hacknet.hashCapacity()) {
				return;
			}
		}
	}
	if (!ns.corporation.hasCorporation() || getAvailableMoney(ns, true) < 10e9) {
		// we need this money
		await spendOn(ns, money);
	} else {
		// we'll get the money from the corporation, use the hashes for other stuff
		for (var upgName of [blade_rank, blade_skill, corp_money, corp_research]) {
			await spendOn(ns, upgName);
		}
		if (options.all || ns.hacknet.numHashes() > 0.75 * ns.hacknet.hashCapacity()) {
			await spendOn(ns, money);
		}
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