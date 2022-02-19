/** @param {NS} ns **/
export async function main(ns) {
	var bootcount = ns.args[0];
	var maxNodes = 4;
	var maxLevel = 50;
	var maxRam = 2;
	var maxCore = 1;
	var scriptHost = "joesguns";

	if (bootcount > 2) {
		maxNodes = 5;
		maxLevel = 100;
	}
	if (bootcount > 4) {
		maxNodes = 6;
		maxLevel = 120;
	}
	if (bootcount > 8) {
		maxLevel = 140;
		maxRam = 3;
	}
	if (bootcount > 16) {
		maxNodes = 8;
		maxLevel = 160;
		maxRam = 4;
	}
	if (bootcount > 24) {
		maxNodes = 10;
		maxLevel = 180;
		maxRam = 6;
		maxCore = 2;
	}
	if (bootcount > 32) {
		maxNodes = 12;
		maxLevel = 200;
		maxCore = 16;
	}
	ns.nuke(scriptHost);
	await ns.scp("start-hacknet2.js", scriptHost);
	ns.killall(scriptHost);
	ns.exec("start-hacknet2.js", scriptHost, 1, maxNodes, maxLevel, maxRam, maxCore);
}