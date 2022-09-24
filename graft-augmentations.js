import { getAvailableMoney } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["install", false]]);
	if (getAvailableMoney(ns) < 1e15) {
		ns.tprintf("Too poor");
		return;
	}
	const database = JSON.parse(ns.read("database.txt"));
	const augs = ns.grafting.getGraftableAugmentations();
	augs.sort((a, b) => ns.grafting.getAugmentationGraftPrice(a) - ns.grafting.getAugmentationGraftPrice(b));
	augs.reverse();
	if (options.install) {
		ns.scriptKill("factiongoals.js", "home");
		// ns.scriptKill("bladerunner.js", "home");
	}
	for (var aug of augs) {
		const requirements = database.augmentations.find(a => a.name == aug).requirements;
		if (requirements.every(r => database.owned_augmentations.includes(r))) {
			var graftTime = ns.grafting.getAugmentationGraftTime(aug);
			//			if (graftTime > 30 * 60 * 1000) {
			//				continue;
			//			}
			ns.tprintf("Grafting '%s', will take %02d:%02d h",
				aug, graftTime / 3600e3, (graftTime / 60e3) % 60);
			if (options.install) {
				ns.grafting.graftAugmentation(aug, true);
				await ns.sleep(graftTime + 1000);
			}
		} else {
			// ns.tprintf("Can't graft %s, missing requirements %s", aug, requirements);
		}
	}
	if (options.install) {
		ns.spawn("factiongoals.js");
	}
}