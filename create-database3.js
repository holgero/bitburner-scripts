import * as c from "constants.js";

/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const owned_augmentations = database.owned_augmentations;
	const faction_augmentations = database.faction_augmentations;
	const augmentations_factions = [];
	buildAugmentationsFactions(ns, faction_augmentations, augmentations_factions);
	await ns.write("database.txt", JSON.stringify(
		{
			faction_augmentations: faction_augmentations,
			augmentations_factions: augmentations_factions,
			owned_augmentations: owned_augmentations
		}), "w");
}

/** @param {NS} ns **/
function buildAugmentationsFactions(ns, factions, augmentations) {
	for (var faction of factions) {
		for (var augmentation of faction.augmentations) {
			augmentations.push({
				...augmentation,
				requirements: ns.getAugmentationPrereq(augmentation.augmentation),
				faction: faction.name
			});
		}
	}
}