import { getAvailableMoney, runAndWait, getDatabase } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["maxTime", 0],
		["type", ""]]);
	const database = getDatabase(ns);
	if (!database.features.graft) {
		ns.tprintf("Don't have grafting api yet.");
		return;
	}
	const augs = ns.grafting.getGraftableAugmentations();
	augs.sort((a, b) => ns.grafting.getAugmentationGraftPrice(a) - ns.grafting.getAugmentationGraftPrice(b));
	augs.reverse();
	ns.tprintf("%d augmentations for grafting available", augs.length);
	var count = 0;
	for (var aug of augs) {
		const augmentation = database.augmentations.find(a => a.name == aug);
		if (augmentation) {
			const requirements = augmentation.requirements;
			if (!requirements.every(r => database.owned_augmentations.includes(r))) {
				continue;
			}
			if (options.type && augmentation.type != options.type) {
				continue;
			}
		}
		const graftTime = ns.grafting.getAugmentationGraftTime(aug);
		if (options.maxTime && graftTime > options.maxTime * 60 * 1000) {
			continue;
		}
		ns.tprintf("Grafting '%s', will take %02d:%02d h",
			aug, graftTime / 3600e3, (graftTime / 60e3) % 60);
	}
}