import { getAvailableMoney, formatMoney } from "helpers.js";
const NEEDRAM = 2048;

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["stop", false]]);
	const maxNo = ns.getPurchasedServerLimit() - 1;
	const hostname = "pserv-" + (maxNo - 1);
	if (options.stop) {
		if (ns.serverExists(hostname)) {
			ns.scriptKill("corporation.js", hostname);
		}
		return;
	}
	if (ns.scriptRunning("corporation.js", "home") ||
		(ns.serverExists(hostname) && ns.scriptRunning("corporation.js", hostname))) {
		ns.printf("Already running");
		return;
	}
	if (createServer(ns, hostname)) {
		for (var file of ["helpers.js", "budget.js", "constants.js", "corporation.js", "database.txt"]) {
			ns.scp(file, hostname);
		}
		ns.exec("corporation.js", hostname);
		ns.tprintf("Started corporation on %s", hostname);
	}
}

/** @param {NS} ns */
export function createServer(ns, hostname) {
	if (ns.serverExists(hostname) &&
		ns.getServerMaxRam(hostname) >= NEEDRAM) {
		ns.killall(hostname);
		return true;
	}
	const need = ns.getPurchasedServerCost(NEEDRAM);
	if (need > getAvailableMoney(ns)) {
		ns.printf("Cannot afford %s for corporation server.", formatMoney(need));
		return false;
	}
	if (ns.serverExists(hostname)) {
		ns.killall(hostname);
		ns.deleteServer(hostname);
	}
	ns.purchaseServer(hostname, NEEDRAM);
	return true;
}