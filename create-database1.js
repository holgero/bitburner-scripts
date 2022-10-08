/** @param {NS} ns **/
export async function main(ns) {
	const database = {
		owned_augmentations: ns.singularity.getOwnedAugmentations(false),
		factions: [],
		augmentations: [],
		favorToDonate: 150
	};
	ns.write("database.txt", JSON.stringify(database), "w");
}