/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	database.owned_augmentations = ns.singularity.getOwnedAugmentations(false);
	ns.write("database.txt", JSON.stringify(database), "w");
}