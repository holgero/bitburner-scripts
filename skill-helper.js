/** @param {NS} ns **/
export function effortForSkillLevel(ns, database, skill, level) {
	const player = ns.getPlayer();
	const playerMult = player.mults[skill];
	const bitnodeMult = getBitnodeMultiplier(ns, database, skill);
	const multiplier = playerMult * bitnodeMult;
	if (player.skills.intelligence) {
		const nextExp = ns.formulas.skills.calculateExp(level, multiplier);
		const currentExp = player.exp[skill];
		return Math.max(0, nextExp - currentExp) / player.mults[skill + "_exp"];
	} else {
		// just make up some number that increases with the skill level difference
		const skillDiff = Math.max(0, skill - player.skills[skill]);
		const weightedDiff = skillDiff / playerMult / bitnodeMult / player.mults[skill + "_exp"];
		return Math.pow(weightedDiff, 4);
	}
}

/** @param {NS} ns **/
function getBitnodeMultiplier(ns, database, skill) {
	if (!database.bitnodemultipliers) {
		return 1.0;
	}
	switch (skill) {
		case "hacking": return database.bitnodemultipliers.HackingLevelMultiplier;
		case "strength": return database.bitnodemultipliers.StrengthLevelMultiplier;
		case "defense": return database.bitnodemultipliers.DefenseLevelMultiplier;
		case "dexterity": return database.bitnodemultipliers.DexterityLevelMultiplier;
		case "agility": return database.bitnodemultipliers.AgilityLevelMultiplier;
		case "charisma": return database.bitnodemultipliers.CharismaLevelMultiplier;
	}
}