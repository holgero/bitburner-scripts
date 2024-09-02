import { runAndWait } from "/helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	while (!(await runAndWait(ns, "database/create-schema.js") &&
		await runAndWait(ns, "database/sourcefiles.js") &&
		await runAndWait(ns, "database/currentnode.js") &&
		await runAndWait(ns, "database/multipliers.js") &&
		await runAndWait(ns, "database/features.js") &&
		await runAndWait(ns, "database/owned-augmentations.js") &&
		await runAndWait(ns, "database/factions.js") &&
		await runAndWait(ns, "database/factions-info.js") &&
		await runAndWait(ns, "database/augmentations.js") &&
		await runAndWait(ns, "database/augmentations-requirements.js") &&
		await runAndWait(ns, "database/augmentations-types.js")
	)) {
		ns.tprintf("Failed to create database!");
		await ns.sleep(1000);
	}
}