/** @param {NS} ns **/
export async function main(ns) {
	var maxNodes = 4;
	var maxLevel = 100;
	var maxRam = 2;
	var maxCore = 1;

	var current = ns.getOwnedAugmentations().length;
	if (current > 0) {
		maxNodes = 6;
		maxLevel = 120;
	}
	if (current > 3) {
		maxNodes = 8;
		maxLevel = 140;
		maxRam = 3;
	}
	if (current > 6) {
		maxLevel = 160;
		maxRam = 4;
	}
	if (current > 9) {
		maxNodes = 10;
		maxLevel = 180;
		maxRam = 6;
		maxCore = 2;
	}
	if (current > 12) {
		maxNodes = 12;
		maxLevel = 200;
		maxCore = 16;
	}

	ns.spawn("start-hacknet2.js", 1, maxNodes, maxLevel, maxRam, maxCore)
}