import { getAvailableMoney, runAndWait, getDatabase } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	const options = ns.flags([
		["install", false],
		["end", false],
		["maxTime", 0],
		["maxCount", 0],
		["type", ""]]);
	if (getAvailableMoney(ns) < 150e12) {
		ns.tprintf("Too poor");
		return;
	}
	const database = getDatabase(ns);
	const augs = ns.grafting.getGraftableAugmentations();
	augs.sort((a, b) => ns.grafting.getAugmentationGraftPrice(a) - ns.grafting.getAugmentationGraftPrice(b));
	augs.reverse();
	ns.printf("%d augmentations for grafting available", augs.length);
	var count = 0;
	for (var aug of augs) {
		if (ns.grafting.getAugmentationGraftPrice(aug) > getAvailableMoney(ns)) {
			ns.printf("Can't graft %s, not enough money", aug);
			continue;
		}
		const augmentation = database.augmentations.find(a => a.name == aug);
		if (augmentation) {
			const requirements = augmentation.requirements;
			if (!requirements.every(r => database.owned_augmentations.includes(r))) {
				ns.printf("Can't graft %s, missing requirements %s", aug, requirements);
				continue;
			}
			if (options.type && augmentation.type != options.type) {
				ns.printf("Can't graft %s, not of type %s", aug, options.type);
				continue;
			}
		} else {
			ns.tprintf("Unknown augmentation '%s' included unfiltered.", aug);
		}
		const graftTime = ns.grafting.getAugmentationGraftTime(aug);
		if (options.maxTime && graftTime > options.maxTime * 60 * 1000) {
			continue;
		}
		if (options.install) {
			while (ns.singularity.getCurrentWork() != null
				&& ns.singularity.getCurrentWork().type == "GRAFTING") {
				ns.printf("Still grafting: %s",
					ns.singularity.getCurrentWork().augmentation);
				await ns.sleep(60000);
			}
			ns.grafting.graftAugmentation(aug, true);
		}
		count++;
		if (options.maxCount && count > options.maxCount) {
			break;
		}
		ns.tprintf("Grafting '%s', will take %02d:%02d h",
			aug, graftTime / 3600e3, (graftTime / 60e3) % 60);
	}
	if (options.end || options.install) {
		await runAndWait(ns, "create-database.js");
	}
}