/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	getMissingInfo(ns, database.augmentations);
	await ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, augmentations) {
	for (var augmentation of augmentations) {
		augmentation.requirements = ns.singularity.getAugmentationPrereq(augmentation.name);
	}
}