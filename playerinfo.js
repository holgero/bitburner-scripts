/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("Player info: %s", JSON.stringify(ns.getPlayer()));
	// var playerInfo = ns.getPlayer();
	// ns.tprintf("Epoch: %d", playerInfo.playtimeSinceLastBitnode - playerInfo.playtimeSinceLastAug  );
}