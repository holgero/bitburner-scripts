/** @param {NS} ns **/
export async function main(ns) {
	const database = JSON.parse(ns.read("database.txt"));
	getMissingInfo(ns, database.augmentations);
	await ns.write("database.txt", JSON.stringify(database), "w");
}

/** @param {NS} ns **/
function getMissingInfo(ns, augmentations) {
	for (var augmentation of augmentations) {
		augmentation.stats = ns.getAugmentationStats(augmentation.name);
		augmentation.type = getTypeOf(ns, augmentation);
	}
}

/** @param {NS} ns **/
function getTypeOf(ns, augmentation) {
	if (augmentation.stats.hacking_mult ||
		augmentation.stats.hacking_exp_mult ||
		augmentation.stats.hacking_grow_mult ||
		augmentation.stats.hacking_chance_mult ||
		augmentation.stats.hacking_speed_mult ||
		augmentation.stats.hacking_money_mult) return "Hacking";
	if (augmentation.stats.faction_rep_mult) return "Reputation";
	if (augmentation.stats.strength_mult ||
		augmentation.stats.strength_exp_mult ||
		augmentation.stats.defense_mult ||
		augmentation.stats.defense_exp_mult ||
		augmentation.stats.dexterity_mult ||
		augmentation.stats.dexterity_exp_mult ||
		augmentation.stats.agility_mult ||
		augmentation.stats.agility_exp_mult) return "Combat";
	if (augmentation.stats.charisma_mult ||
		augmentation.stats.company_rep_mult ||
		augmentation.stats.work_money_mult ||
		augmentation.stats.charisma_exp_mult) return "Company";
	if (augmentation.stats.hacknet_node_money_mult ||
		augmentation.stats.hacknet_node_purchase_cost_mult ||
		augmentation.stats.hacknet_node_level_cost_mult) return "Hacknet";
	ns.print(JSON.stringify(augmentation));
	return "";
}