/** @param {NS} ns **/
export function effortForSkillLevel(ns, database, skill, level) {
	const player = ns.getPlayer();
	const playerMult = player.mults[skill];
	const bitnodeMult = getBitnodeMultiplier(ns, database, skill);
	const multiplier = playerMult * bitnodeMult;
	const nextExp = ns.formulas.skills.calculateExp(level, multiplier);
	const currentExp = player.exp[skill];
	return Math.max(0, nextExp - currentExp) / player.mults[skill + "_exp"];
}

/** @param {NS} ns **/
function getBitnodeMultiplier(ns, database, skill) {
	switch (skill) {
		case "hacking": return database.bitnodemultipliers.HackingLevelMultiplier;
		case "strength": return database.bitnodemultipliers.StrengthLevelMultiplier;
		case "defense": return database.bitnodemultipliers.DefenseLevelMultiplier;
		case "dexterity": return database.bitnodemultipliers.DexterityLevelMultiplier;
		case "agility": return database.bitnodemultipliers.AgilityLevelMultiplier;
		case "charisma": return database.bitnodemultipliers.CharismaLevelMultiplier;
	}
}