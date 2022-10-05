/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	getMissingInfo(ns, database.augmentations);
	await ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, augmentations) {
	for (var augmentation of augmentations) {
		augmentation.stats = ns.singularity.getAugmentationStats(augmentation.name);
		augmentation.type = getTypeOf(ns, augmentation);
	}
}

/** @param {NS} ns **/
function getTypeOf(ns, augmentation) {
	const stats = augmentation.stats;
	if (stats.bladeburner_analysis > 1 ||
		stats.bladeburner_max_stamina > 1 ||
		stats.bladeburner_stamina_gain > 1 ||
		stats.bladeburner_success_chance > 1) return "Bladeburner";
	if (stats.hacking > 1 ||
		stats.hacking_exp > 1 ||
		stats.hacking_grow > 1 ||
		stats.hacking_chance > 1 ||
		stats.hacking_speed > 1 ||
		stats.hacking_money > 1) return "Hacking";
	if (stats.faction_rep > 1) return "Reputation";
	if (stats.strength > 1 ||
		stats.strength_exp > 1 ||
		stats.defense > 1 ||
		stats.defense_exp > 1 ||
		stats.dexterity > 1 ||
		stats.dexterity_exp > 1 ||
		stats.agility > 1 ||
		stats.agility_exp > 1) return "Combat";
	if (stats.charisma > 1 ||
		stats.company_rep > 1 ||
		stats.work_money > 1 ||
		stats.charisma_exp > 1) return "Company";
	if (stats.hacknet_node_money > 1 ||
		stats.hacknet_node_purchase_cost > 1 ||
		stats.hacknet_node_level_cost > 1) return "Hacknet";
	if (stats.crime_money > 1 ||
		stats.crime_success > 1) return "Crime";

	ns.print(JSON.stringify(augmentation));
	return "Special";
}