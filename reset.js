/** @param {NS} ns **/
export async function main(ns) {
	ns.singularity.installAugmentations("nodestart.js");
	ns.singularity.softReset("nodestart.js");
}