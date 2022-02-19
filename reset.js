/** @param {NS} ns **/
export async function main(ns) {
	ns.installAugmentations("nodestart.js");
	ns.softReset("nodestart.js");
}