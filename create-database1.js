/** @param {NS} ns **/
export async function main(ns) {
	const owned_augmentations = ns.getOwnedAugmentations(true);
	await ns.write("database.txt", JSON.stringify(
		{
			owned_augmentations: owned_augmentations
		}), "w");
}