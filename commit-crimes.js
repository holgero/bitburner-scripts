/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([["on-idle", false]]);
	if (options["on-idle"]) {
		const current = ns.singularity.getCurrentWork();
		if (current != null && current.type != "CRIME") {
			// busy
			return;
		}
	}
	for (var crime of [ns.enums.CrimeType.homicide, ns.enums.CrimeType.mug, ns.enums.CrimeType.shoplift]) {
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
	if (current != null && current.type == "GRAFTING") {
		ns.printf("Currently grafting %s", current.augmentation);
		return;
	}
	ns.singularity.commitCrime(crime);
}