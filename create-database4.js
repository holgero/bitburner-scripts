/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	const owned_augmentations = database.owned_augmentations;
	const factions = database.factions;
	const augmentations = [];
	buildAugmentations(ns, factions, augmentations);
	await ns.write("database.txt", JSON.stringify(
		{
			owned_augmentations: owned_augmentations,
			factions: factions,
			augmentations: augmentations,
		}), "w");
}

/** @param {NS} ns **/
function buildAugmentations(ns, factions, augmentations) {
	for (var faction of factions) {
		for (var augmentation of faction.augmentations) {
			var existing = augmentations.find(a => a.name == augmentation);
			if (existing) {
				existing.factions.push(faction.name);
			} else {
				augmentations.push({
					name: augmentation,
					reputation: ns.getAugmentationRepReq(augmentation),
					price: ns.getAugmentationPrice(augmentation),
					factions: [faction.name],
				});
			}
		}
	}
}