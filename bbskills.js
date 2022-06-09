const SKILL_RESTRICTIONS = [
	{ name: "Datamancer", max: 9 },
	{ name: "Tracer", max: 10 },
	{ name: "Hands of Midas", prefer: 3 },
	{ name: "Overclock", max: 90, prefer: 2 },
]

/** @param {NS} ns */
export async function main(ns) {
	if (!spendPrefered(ns)) {
		spendSkillPoints(ns);
	}
}

/** @param {NS} ns */
function spendPrefered(ns) {
	for (var skill of SKILL_RESTRICTIONS.filter(a => a.prefer).sort((a, b) => a.prefer - b.prefer).reverse()) {
		var preferFactor = skill.prefer;
		if (ns.bladeburner.getSkillUpgradeCost(skill.name) <= preferFactor * ns.bladeburner.getSkillPoints()) {
			while (ns.bladeburner.getSkillUpgradeCost(skill.name) <= ns.bladeburner.getSkillPoints()) {
				ns.tprintf("Spending %d skillpoints on %s",
					ns.bladeburner.getSkillUpgradeCost(skill.name), skill.name)
				if (!ns.bladeburner.upgradeSkill(skill.name)) break;
			}
			ns.printf("Holding back skill points for %s", skill.name);
			return true;
		}
	}
	return false;
}

/** @param {NS} ns */
function spendSkillPoints(ns) {
	for (var skill of ns.bladeburner.getSkillNames()) {
		const restriction = SKILL_RESTRICTIONS.find(a => a.name == skill);
		if (restriction) {
			if (restriction.max) {
				if (ns.bladeburner.getSkillLevel(skill) >= restriction.max) {
					continue;
				}
			}
		}
		if (ns.bladeburner.getSkillUpgradeCost(skill) <= ns.bladeburner.getSkillPoints()) {
			ns.tprintf("Spending %d skillpoints on %s",
				ns.bladeburner.getSkillUpgradeCost(skill), skill)
			return ns.bladeburner.upgradeSkill(skill);
		}
	}
}