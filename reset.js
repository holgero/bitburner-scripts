/** @param {NS} ns **/
export async function main(ns) {
	for (var countDown = 10; countDown >0; countDown--) {
		ns.tprintf("Reset in %d seconds", countDown);
		await ns.sleep(1000);
	}
	ns.singularity.installAugmentations("nodestart.js");
	ns.singularity.softReset("nodestart.js");
}