import { runAndWait } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	for (var countDown = 10; countDown >0; countDown--) {
		ns.tprintf("Reset in %d seconds", countDown);
		await ns.sleep(1000);
	}
	await runAndWait(ns, "spend-hashes.js", "--all");
	await runAndWait(ns, "governors.js");
	await runAndWait(ns, "purchase-sleeve-augs.js");
	await ns.sleep(300);
	ns.tprint("Reset");
	ns.singularity.installAugmentations("nodestart.js");
	ns.singularity.softReset("nodestart.js");
}
