import { canRunAction } from "./helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (!canRunAction(ns, "work")) {
		ns.printf("Cannot work at the moment");
		return;
	}

	for (var crime of [ "HOMICIDE", "MUG", "SHOPLIFT"]) {
		if (ns.singularity.getCrimeChance(crime) >= 0.5) {
			commitCrime(ns, crime);
			return;
		}
	}
	commitCrime(ns, "SHOPLIFT");
}

/** @param {NS} ns **/
function commitCrime(ns, crime) {
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "CRIME" && current.crimeType == crime) {
		ns.printf("Already commiting %s", current.crimeType);
		return;
	}
	ns.singularity.commitCrime(crime);
}