import { statsGainFactor } from "/helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("%s", JSON.stringify(ns.getPlayer()));
	// var playerInfo = ns.getPlayer();
	// ns.tprintf("Epoch: %d", playerInfo.playtimeSinceLastBitnode - playerInfo.playtimeSinceLastAug  );
	ns.tprintf("Stats gain factor: %f", statsGainFactor(ns));
}