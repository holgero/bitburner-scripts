/** @param {NS} ns **/
export async function main(ns) {
	var ram = ns.args[0];
	var threads = ns.args[1];
	var script = ns.args[2];
	var victims = JSON.parse(ns.args[3]);

	for (var ii=0; ii<victims.length; ii++) {
		var hostname;
		if (!ns.serverExists(hostname)) {
			while (true) {
				hostname = ns.purchaseServer("pserv-" + ii, ram);
				if ("" == hostname) {
					break;
				}
				await ns.sleep(60000);
			}
			ns.scp(script, hostname);
			exec(script, hostname, threads, victims[ii]);
		}
	}
}