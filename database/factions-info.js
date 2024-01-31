import * as c from "constants.js";

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
		faction.favor = ns.singularity.getFactionFavor(faction.name);
		if (faction.company) {
			faction.companyFavor = ns.singularity.getCompanyFavor(faction.company);
		}
		if (ns.gang.inGang()) {
			if (faction.name == ns.gang.getGangInformation().faction) {
				faction.gang = true;
			}
		}
	}
}