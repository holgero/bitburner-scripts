/** @param {NS} ns **/
export async function main(ns) {
	const database = {
		owned_augmentations: ns.getOwnedAugmentations(true),
		factions: [],
		augmentations: [],
		favorToDonate: 150
	};
	await ns.write("database.txt", JSON.stringify(database), "w");
}