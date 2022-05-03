/** @param {NS} ns */
export function xgetAugmentationPrice(ns, augmentation) {
	const database = JSON.parse(ns.read("database.txt"));
	return database.augmentations.find(aug => aug.name == augmentation).price;
}