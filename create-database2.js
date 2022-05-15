import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	buildFactionAugmentations(ns, database.factions, database.owned_augmentations);
	await ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function buildFactionAugmentations(ns, factions, owned_augmentations) {
	var ignore = owned_augmentations.slice(0);
	ignore.push(c.GOVERNOR);
	for (var faction_name of c.ALL_FACTIONS) {
		var faction = c.STORY_LINE.find(a => a.name == faction_name);
		if (!faction) {
			faction = { name: faction_name }
		}
		var augmentations = ns.getAugmentationsFromFaction(faction_name).
			filter(a => !ignore.includes(a));
		factions.push({ ...faction, augmentations: augmentations });
	}
}