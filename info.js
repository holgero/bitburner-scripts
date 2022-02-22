/** @param {NS} ns **/
export async function main(ns) {
	var augmentations = [];
	for (var faction of ns.args) {
		var faction_augmentations = ns.getAugmentationsFromFaction(faction);
		for (var augmentation of faction_augmentations) {
			if (!augmentations.includes(augmentation)) {
				augmentations.push(augmentation);
			}
		}
	}
	ns.tprintf("Sorted by price");
	augmentations.sort(function (a, b) { return ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b) });
	for (var augmentation of augmentations) {
		var price = ns.getAugmentationPrice(augmentation);
		var rep = ns.getAugmentationRepReq(augmentation);
		var have = ns.getOwnedAugmentations().includes(augmentation) ? "*" : " ";
		ns.tprintf("%50s costs %10d needs %10d %s", augmentation, price, rep, have);
	}

	ns.tprintf("\nSorted by Reputation");
	augmentations.sort(function (a, b) { return ns.getAugmentationRepReq(a) - ns.getAugmentationRepReq(b) });
	for (var augmentation of augmentations) {
		var price = ns.getAugmentationPrice(augmentation);
		var rep = ns.getAugmentationRepReq(augmentation);
		var have = ns.getOwnedAugmentations().includes(augmentation) ? "*" : " ";
		ns.tprintf("%50s costs %10d needs %10d %s", augmentation, price, rep, have);
	}
}