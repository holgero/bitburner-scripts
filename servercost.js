import { getAvailableMoney, formatMoney, getHackingProfitability } from "helpers.js";

const SERVER_PREFIX = "pserv-";
const RESERVE = 1e6;

/** @param {NS} ns **/
export async function main(ns) {
	const numberOfServers = ns.getPurchasedServerLimit();
	if (numberOfServers == 0) {
		ns.printf("Cannot buy any servers.");
		return;
	}
	const existingRam = [];
	for (var ii = 0; ii < numberOfServers; ii++) {
		const hostname = SERVER_PREFIX + ii;
		if (!ns.serverExists(hostname)) {
			continue;
		}
		const serverRam = ns.getServerMaxRam(hostname);
		if (!existingRam.find(a => a.ram == serverRam)) {
			existingRam.push({ name: hostname, ram: serverRam });
		}
	}
	ns.tprintf("Available money to spend on servers: %s", formatMoney(availableMoney(ns)));
	for (const server of existingRam) {
		ns.tprintf("Cost to upgrade server %s with ram %d GB to %d GB: %s",
			server.name,
			server.ram, 2 * server.ram,
			formatMoney(ns.getPurchasedServerUpgradeCost(server.name, 2 * server.ram)));
	}
}

/** @param {NS} ns */
function availableMoney(ns) {
	// spend about half of the available money on server upgrades
	var available = getAvailableMoney(ns, false) / 2;
	// if hacking is not profitable, spend less on servers
	const multiplier = Math.sqrt(getHackingProfitability(ns));
	if (multiplier < 1) {
		available = available * multiplier;
	}
	
	return Math.min(getAvailableMoney(ns, false) - RESERVE, available);
}