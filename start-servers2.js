import { releaseBudget, deleteBudget } from "budget.js";

/** @param {NS} ns **/
export async function main(ns) {
	const ram = ns.args[0];
	const cost = ns.args[1];
	const script = ns.args[2];
	const victims = JSON.parse(ns.args[3]);

	for (var ii = 0; ii < victims.length; ii++) {
		var hostname = "pserv-" + ii;
		if (ns.serverExists(hostname)) {
			while (true) {
				if (ns.upgradePurchasedServer("pserv-" + ii, ram)) {
					break;
				}
				await ns.sleep(60000);
			}
		} else {
			while (true) {
				var result = ns.purchaseServer("pserv-" + ii, ram);
				if (result == hostname) {
					releaseBudget(ns, "servers", cost);
					break;
				}
				if (victims.length == 1) {
					return;
				}
				if (result != "") {
					ns.tprintf("Hostname change??? wanted: %s, got: %s", hostname, result);
					return;
				}
				await ns.sleep(60000);
			}
		}
		ns.scp(script, hostname);
		var threads = Math.floor(ns.getServer(hostname).maxRam / ns.getScriptRam(script));
		ns.exec(script, hostname, threads, victims[ii]);
	}
	deleteBudget(ns, "servers");
}