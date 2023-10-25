import { getAvailableMoney, formatMoney, getDatabase } from "helpers.js";

const SERVER_PREFIX = "pserv-";
const SCRIPT = "hack-server.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["reserve", 2e9], ["restart", false]]);
	const available = getAvailableMoney(ns, false) - options.reserve;
	if (available < 0) {
		ns.printf("No money available (%s)", formatMoney(available));
		return;
	}
	const database = getDatabase(ns);
	if (database.bitnodemultipliers.ScriptHackMoneyGain <= 0) {
		ns.printf("No money from purchased servers, not buying servers");
		return;
	}
	const numberOfServers = ns.getPurchasedServerLimit();
	if (numberOfServers == 0) {
		ns.printf("Cannot buy any servers.");
		return;
	}
	const victims = JSON.parse(ns.read("victims.txt"));
	ns.printf("Victims: %v", victims);
	for (var ii = 0; ii < numberOfServers; ii++) {
		const hostname = SERVER_PREFIX + ii;
		if (ns.serverExists(hostname)) {
			const currentRam = ns.getServerMaxRam(hostname);
			const nextRam = Math.min(ns.getPurchasedServerMaxRam(), 2 * currentRam);
			if (nextRam > currentRam) {
				const cost = ns.getPurchasedServerUpgradeCost(hostname, nextRam);
				if (cost < available) {
					ns.printf("Can upgrade %s from %d to %d", hostname, currentRam, nextRam);
					const procs = ns.ps(hostname).filter(a => a.filename == SCRIPT);
					if (procs.length > 0 && !options.restart) {
						const process = procs[0];
						const victim = process.args[0];
						const spid = process.pid;
						ns.printf("Script %s runs with pid %d on %s, victim %s",
							SCRIPT, spid, hostname, victim);
						if (ns.upgradePurchasedServer(hostname, nextRam)) {
							ns.kill(spid);
							const threads = Math.floor(nextRam / ns.getScriptRam(SCRIPT));
							ns.exec(SCRIPT, hostname, threads, victim);
							ns.tprintf("Upgraded %s from %d to %d, runs against %s with %d threads",
								hostname, currentRam, nextRam, victim, threads);
							return;
						}
					} else {
						const victim = victims[ii % victims.length];
						if (procs.length > 0) {
							const process = procs[0];
							if (victim == process.args[0]) {
								continue;
							}
							const spid = process.pid;
							ns.kill(spid);
						}
						const threads = Math.floor(currentRam / ns.getScriptRam(SCRIPT));
						ns.exec(SCRIPT, hostname, threads, victim);
						ns.tprintf("Started script on %s against %s with %d threads",
							hostname, victim, threads);
					}
				}
			}
		} else {
			const nextRam = 32;
			if (ns.getPurchasedServerCost(nextRam) < available) {
				const result = ns.purchaseServer(hostname, nextRam);
				const victim = victims[ii % victims.length];
				if (result == hostname) {
					ns.scp(SCRIPT, hostname);
					const threads = Math.floor(nextRam / ns.getScriptRam(SCRIPT));
					ns.exec(SCRIPT, hostname, threads, victim);
					ns.tprintf("Purchased %s with %d ram, runs against %s with %d threads",
						hostname, nextRam, victim, threads);
					return;
				}
			}
		}
	}
}