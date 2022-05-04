/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const owned_augmentations = database.owned_augmentations;
	const factions = database.factions;
	addFactionInformation(ns, factions);
	await ns.write("database.txt", JSON.stringify(
		{
			owned_augmentations: owned_augmentations,
			factions: factions,
		}), "w");
}

/** @param {NS} ns **/
function addFactionInformation(ns, factions) {
	for (var faction of factions) {
		faction.favor = ns.getFactionFavor(faction.name);
		if (faction.company) {
			faction.companyFavor = ns.getCompanyFavor(faction.name);
		}
	}
}