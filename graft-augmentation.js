import {
	getAvailableMoney, runAndWait, getDatabase,
	getAugmentationPrios
} from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const database = getDatabase(ns);
	if (!database.features.graft) {
		ns.tprintf("Don't have grafting api yet.");
		return;
	}

	const augmentations = getGraftableAugmentations(ns, database);
	const aug = selectAugByPrio(ns, augmentations).name;
	ns.printf("Selected for grafting %s", aug);
	var currentWork = ns.singularity.getCurrentWork();
	if (!currentWork || currentWork.type != "GRAFTING") {
		ns.tprintf("Start grafting %s", aug);
		ns.grafting.graftAugmentation(aug, true);
		await ns.sleep(5000);
	}

	do {
		currentWork = ns.singularity.getCurrentWork();
		if (!currentWork || currentWork.type != "GRAFTING") {
			break;
		}
		ns.printf("Still grafting: %s", currentWork.augmentation);
		await ns.sleep(60000);
	} while (true);

	await runAndWait(ns, "database/create.js");
}

/** @param {NS} ns */
function getGraftableAugmentations(ns, database) {
	const moneyAvailable = getAvailableMoney(ns);

	const augs = ns.grafting.getGraftableAugmentations().
		filter(a => ns.grafting.getAugmentationGraftPrice(a) < moneyAvailable);
	augs.sort((a, b) => ns.grafting.getAugmentationGraftPrice(a) - ns.grafting.getAugmentationGraftPrice(b));
	augs.reverse();
	ns.printf("%d augmentations for grafting available", augs.length);
	if (augs[0]=='nickofolas Congruity Implant') {
		return [{name:'nickofolas Congruity Implant'}];
	}

	var augmentations = augs.map(a => database.augmentations.find(b => b.name == a));
	ns.printf("%d augmentations for grafting also in database", augs.length);

	augmentations = augmentations.filter(a => a && (!a.requirements ||
		a.requirements.every(r => database.owned_augmentations.includes(r))));
	ns.printf("%d augmentations for grafting possible", augmentations.length);

	return augmentations;
}

/** @param {NS} ns */
function selectAugByPrio(ns, augs) {
	for (var prio of getAugmentationPrios(ns)) {
		const prioAugs = augs.filter(a => a.type == prio);
		if (prioAugs.length > 0) {
			return prioAugs[0];
		}
	}
	return augs[0];
}