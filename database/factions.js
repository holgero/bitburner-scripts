import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	buildFactionAugmentations(ns, database);
	ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function buildFactionAugmentations(ns, database) {
	var ignore = database.owned_augmentations.slice(0);
	ignore.push(c.GOVERNOR);
	for (var faction_name of c.ALL_FACTIONS) {
		if (faction_name == c.BLADEBURNERS && !database.features.includes("bladeburners")) {
			continue;
		}
		if (faction_name == c.CHURCH && !database.features.includes("church")) {
			continue;
		}
		var faction = c.STORY_LINE.find(a => a.name == faction_name);
		if (!faction) {
			faction = { name: faction_name }
		}
		var augmentations = ns.singularity.getAugmentationsFromFaction(faction_name).
			filter(a => !ignore.includes(a));
		database.factions.push({ ...faction, augmentations: augmentations });
	}
}