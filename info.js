/** @param {NS} ns **/
export async function main(ns) {
	var faction = ns.args[0];
	var augmentations = ns.getAugmentationsFromFaction(faction);
	ns.tprintf("Sorted by price");
	augmentations.sort(function (a,b) {return ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b)});
	for (var augmentation of augmentations) {
		var price = ns.getAugmentationPrice(augmentation);
		var rep = ns.getAugmentationRepReq(augmentation);
		ns.tprintf("%40s costs %10d needs %10d", augmentation,  price, rep);
	}

	ns.tprintf("\nSorted by Reputation");
	augmentations.sort(function (a,b) {return ns.getAugmentationRepReq(a) - ns.getAugmentationRepReq(b)});
	for (var augmentation of augmentations) {
		var price = ns.getAugmentationPrice(augmentation);
		var rep = ns.getAugmentationRepReq(augmentation);
		ns.tprintf("%40s costs %10d needs %10d", augmentation,  price, rep);
	}
}