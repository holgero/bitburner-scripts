/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	database.favorToDonate = ns.getFavorToDonate();
	addFactionInformation(ns, database.factions);
	await ns.write("database.txt", JSON.stringify(database), "w");
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