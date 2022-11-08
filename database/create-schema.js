/** @param {NS} ns **/
export async function main(ns) {
	const database = {
		owned_augmentations: [],
		factions: [],
		augmentations: [],
		favorToDonate: 150,
		features: [],
	};
	ns.write("database.txt", JSON.stringify(database), "w");
}