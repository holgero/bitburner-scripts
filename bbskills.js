const SKILL_RESTRICTIONS = [
	{ name: "Datamancer", max: 9 },
	{ name: "Tracer", max: 10 },
	{ name: "Hands of Midas", max: 100, prefer: 2.5 },
	{ name: "Overclock", max: 90, prefer: 2 },
]

/** @param {NS} ns */
export async function main(ns) {
	if (ns.corporation.hasCorporation()) {
		SKILL_RESTRICTIONS.find(x=>x.name=="Hands of Midas").max=0;
	}
	if (!spendPrefered(ns)) {
		spendSkillPoints(ns);
	}
}

/** @param {NS} ns */
function spendPrefered(ns) {
	for (var skill of SKILL_RESTRICTIONS.filter(a => a.prefer).sort((a, b) => a.prefer - b.prefer).reverse()) {
		if (ns.bladeburner.getSkillLevel(skill.name) >= skill.max) {
			continue;
		}
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
	var possibleSkills = [];
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
			possibleSkills.push({
				name: skill,
				cost:ns.bladeburner.getSkillUpgradeCost(skill),
			});
		}
	}
	possibleSkills.sort((a,b)=>a.cost-b.cost);
	for (var skill of possibleSkills) {
		if (skill.cost <= ns.bladeburner.getSkillPoints()) {
			if (!ns.bladeburner.upgradeSkill(skill.name)) break;
			ns.printf("Spent %d skillpoints on %s", skill.cost, skill.name);
		}
	}
}