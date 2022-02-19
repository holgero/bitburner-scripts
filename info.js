/** @param {NS} ns **/
export async function main(ns) {
	var faction = ns.args[0];
	var augmentations = ns.getAugmentationsFromFaction(faction);
	augmentations.sort(function (a,b) {return ns.getAugmentationPrice(a) - ns.getAugmentationPrice(b)});
	for (var augmentation of augmentations) {
		var price = ns.getAugmentationPrice(augmentation);
		var rep = ns.getAugmentationRepReq(augmentation);
		ns.tprintf(augmentation + " costs " + price + " needs " + rep);
	}
}