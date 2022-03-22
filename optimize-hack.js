/** @param {NS} ns **/
export async function main(ns) {
	if (!ns.serverExists("pserv-0")) {
		ns.tprint("No servers running to optimize for hacking...");
		return;
	}
	for (var ii = 0; ii < ns.getPurchasedServerLimit(); ii++) {
		var hostname = "pserv-" + ii;
		var threads = Math.floor(ns.getServerMaxRam(hostname)/ns.getScriptRam("do-hack.js"));
		await ns.scp("do-hack.js", hostname);
		ns.killall(hostname);
		ns.exec("do-hack.js", hostname, threads, "foodnstuff");
	}
}