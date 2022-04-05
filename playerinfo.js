/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("%s", JSON.stringify(ns.getPlayer()));
	// var playerInfo = ns.getPlayer();
	// ns.tprintf("Epoch: %d", playerInfo.playtimeSinceLastBitnode - playerInfo.playtimeSinceLastAug  );
	var player = ns.getPlayer();
	ns.tprintf("Stats gain factor: %f", statsGainFactor(ns, player));
}

/** @param {NS} ns **/
function statsGainFactor(ns, player) {
	var stats_mult = Math.min(
		player.strength_mult,
		player.defense_mult,
		player.dexterity_mult,
		player.agility_mult);
	var stats_exp_mult = Math.min(
		player.strength_exp_mult,
		player.defense_exp_mult,
		player.dexterity_exp_mult,
		player.agility_exp_mult);

	ns.tprintf("Stats factor: %f, stats exp factor: %f", stats_mult, stats_exp_mult);
	return stats_mult * stats_exp_mult;
}