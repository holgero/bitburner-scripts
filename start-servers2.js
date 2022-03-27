/** @param {NS} ns **/
export async function main(ns) {
	var ram = ns.args[0];
	var script = ns.args[1];
	var victims = JSON.parse(ns.args[2]);

	for (var ii = 0; ii < victims.length; ii++) {
		var hostname = "pserv-" + ii;
		if (!ns.serverExists(hostname)) {
			while (true) {
				var result = ns.purchaseServer("pserv-" + ii, ram);
				if (result == hostname) {
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
		await ns.scp(script, hostname);
		var threads = Math.floor(ns.getServer(hostname).maxRam / ns.getScriptRam(script));
		ns.exec(script, hostname, threads, victims[ii]);
	}
}