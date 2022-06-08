const SKILL_RESTRICTIONS = [
	{ name:"Datamancer", max:9 },
	{ name:"Tracer", max:10 },
	{ name:"Hands of Midas", prefered:true },
	{ name:"Overclock", prefered:true },
]

/** @param {NS} ns */
export async function main(ns) {
	if (!spendSkillPoints(ns, true)) {
		spendSkillPoints(ns, false);
	}
}

/** @param {NS} ns */
function spendSkillPoints(ns, preferedOnly) {
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
			if (preferedOnly) {
				if (!restriction || !restriction.prefered) {
					continue;
				}
			}
			ns.tprintf("Spending %d skillpoints on %s",
				ns.bladeburner.getSkillUpgradeCost(skill), skill)
			return ns.bladeburner.upgradeSkill(skill);
		}
	}
	return false;
}