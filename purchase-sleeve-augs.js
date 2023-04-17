import { getDatabase, runAndWait } from "helpers.js";

/** @param {NS} ns */
export async function main(ns) {
	const database = getDatabase(ns);
	if (!database.features.sleeves) {
		return;
	}
	await runAndWait(ns, "joinfactions.js", "--all");

	for (var ii = 0; ii < ns.sleeve.getNumSleeves(); ii++) {
		const sleevie = ns.sleeve.getSleeve(ii);
		ns.printf("Sleeve %d: %s", ii, JSON.stringify(sleevie));
		if (sleevie.shock == 0) {
			const augs = ns.sleeve.getSleevePurchasableAugs(ii).sort((a, b) => a.cost - b.cost).reverse();
			for (var aug of augs) {
				if (ns.sleeve.purchaseSleeveAug(ii, aug.name)) {
					ns.tprintf("Installed '%s' on sleeve %d", aug.name, ii);
				}
			}
		}
	}
}