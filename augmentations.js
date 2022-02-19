/** @param {NS} ns **/
export async function main(ns) {
	for (var faction of ns.getPlayer().factions) {
		var augmentations = ns.getAugmentationsFromFaction(faction);
		var money = ns.getServerMoneyAvailable("home");
		var reputation = ns.getFactionRep(faction);
		for (var augmentation of augmentations) {
			var price = ns.getAugmentationPrice(augmentation);
			var repReq = ns.getAugmentationRepReq(augmentation);
			if (price < money && repReq < reputation) {
				ns.tprintf("Afordable augmentation %s: $%d, rep %d", augmentation, price, repReq);
			}
		}
	}
}