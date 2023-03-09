import { runAndWait } from "helpers.js";
const prefix = "hacknet-server-";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["kill-scripts", false]]);
	for (var ii = 0; ii < ns.hacknet.numNodes(); ii++) {
		if (options["kill-scripts"]) {
			killScripts(ns, prefix + ii);
		}
	}
}

/** @param {NS} ns **/
async function killScripts(ns, server) {
	ns.killall(server);
}