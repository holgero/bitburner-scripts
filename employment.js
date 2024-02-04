/** @param {NS} ns */
export async function main(ns) {
	for (const company of Object.values(ns.enums.CompanyName)) {
		const position = ns.singularity.getCompanyPositions(company).
			filter(a => canFillPosition(ns, company, a)).
			sort((a,b) => ns.singularity.getCompanyPositionInfo(company, a).salary - ns.singularity.getCompanyPositionInfo(company, b).salary).
			reverse()[0];
		ns.printf("Company %20s, position: %20s", company, position);
		if (ns.singularity.applyToCompany(company, ns.singularity.getCompanyPositionInfo(company, position).field)) {
			ns.tprintf("Successfully applied for position %s at %s", position, company);
		}
	}
}

/** @param {NS} ns */
function canFillPosition(ns, company, position) {
	const requirements = ns.singularity.getCompanyPositionInfo(company, position);
	const companyRep = ns.singularity.getCompanyRep(company);
	const player = ns.getPlayer();
	if (haveSkills(ns, requirements.requiredSkills, player.skills) &&
		companyRep >= requirements.requiredReputation) {
		ns.printf("   Requirements: %s", JSON.stringify(requirements));
		return true;
	}
}

/** @param {NS} ns */
function haveSkills(ns, requiredSkills, playerSkills) {
	for (const skillName of Object.keys(requiredSkills)) {
		if (requiredSkills[skillName] > playerSkills[skillName]) {
			ns.printf("Required %s: %s (have %s)",
				skillName,
				requiredSkills[skillName],
				playerSkills[skillName]);
			return false;
		}
	}
	return true;
}