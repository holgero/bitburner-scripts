const SKILL_RESTRICTIONS = [
	{ name:"Datamancer", max:9 },
	{ name:"Tracer", max:10 }
]

/** @param {NS} ns */
export async function main(ns) {
	for (var skill of ns.bladeburner.getSkillNames()) {
		if (ns.bladeburner.getSkillUpgradeCost(skill) <= ns.bladeburner.getSkillPoints()) {
			const restriction = SKILL_RESTRICTIONS.find(a=>a.name==skill);
			if (restriction) {
				if (restriction.max) {
					if (ns.bladeburner.getSkillLevel(skill) >= restriction.max) {
						continue;
					}
				}
			}
			ns.tprintf("Spending %d skillpoints on %s",
				ns.bladeburner.getSkillUpgradeCost(skill), skill)
			ns.bladeburner.upgradeSkill(skill);
		}
	}
}