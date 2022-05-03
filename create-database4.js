/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const owned_augmentations = database.owned_augmentations;
	const factions = database.factions;
	const augmentations = database.augmentations;
	getMissingInfo(ns, augmentations);
	await ns.write("database.txt", JSON.stringify(
		{
			owned_augmentations: owned_augmentations,
			factions: factions,
			augmentations: augmentations,
		}), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, augmentations) {
	for (var augmentation of augmentations) {
		augmentation.requirements = ns.getAugmentationPrereq(augmentation.name);
	}
}