/** @param {NS} ns **/
export async function main(ns) {
	var maxNodes = Math.min(32, ns.args[0]);
	var maxLevel = Math.min(200, Math.round(ns.args[0] * 12.5));
	var maxRam = Math.min(64, Math.round(ns.args[0] / 2));
	var maxCore = Math.min(16, Math.round(ns.args[0] / 4));
	var scriptHost = "joesguns";

	await ns.scp("start-hacknet2.js", scriptHost);
	ns.killall(scriptHost);
	ns.exec("start-hacknet2.js", scriptHost, 1, maxNodes, maxLevel, maxRam, maxCore);
}