import { getAvailableMoney, formatMoney, getDatabase } from "helpers.js";
import { reserveBudget } from "budget.js";

const SERVER_PREFIX = "pserv-";
const SCRIPT = "hack-server.js";
const VICTIMS = [
	"syscore", "zb-institute", "solaris", "lexo-corp", "alpha-ent",
	"rho-construction", "catalyst", "aevum-police", "summit-uni", "netlink",
	"millenium-fitness", "rothman-uni", "johnson-ortho", "omega-net",
	"crush-fitness", "silver-helix", "phantasy", "iron-gym", "max-hardware",
	"zer0", "harakiri-sushi", "neo-net", "hong-fang-tea", "nectar-net",
	"joesguns", "sigma-cosmetics", "foodnstuff"];

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["ram", 32],
		["single", false],
		["restart", false],
		["upgrade", false],
		["auto-upgrade", false]
	]);

	const database = getDatabase(ns);
	if (database.bitnodemultipliers) {
		if (database.bitnodemultipliers.ScriptHackMoneyGain <= 0) {
			ns.printf("No money from purchased servers, not buying servers");
			return;
		}
	}

	var numberOfServers = options.single ? 1 : ns.getPurchasedServerLimit();
	if (numberOfServers == 0) {
		ns.printf("Cannot buy any servers.");
		return;
	}
	if (options["auto-upgrade"]) {
		var hostname = SERVER_PREFIX + "0";
		var nextRam = 32;
		if (ns.serverExists(hostname)) {
			nextRam = Math.min(ns.getPurchasedServerMaxRam(), 8 * ns.getServerMaxRam(hostname));
		}
		var money = getAvailableMoney(ns);
		while (ns.getPurchasedServerCost(nextRam * 2) * numberOfServers < money &&
			nextRam * 2 <= ns.getPurchasedServerMaxRam()) {
			nextRam *= 2;
		}
		if (ns.serverExists(hostname) && ns.getServerMaxRam(hostname) >= nextRam) {
			return;
		}
		if (money < ns.getPurchasedServerCost(nextRam) * numberOfServers) {
			return;
		}
		options.ram = nextRam;
		options.upgrade = ns.serverExists(hostname);
	}

	var currentHackingSkill = ns.getPlayer().skills.hacking;

	var victims = VICTIMS.filter(
		victim => ns.getServer(victim).hasAdminRights &&
			(ns.getServer(victim).requiredHackingSkill <= currentHackingSkill));
	victims.sort((a, b) => ns.getServer(a).moneyMax - ns.getServer(b).moneyMax);
	while (victims.length < numberOfServers) {
		victims = victims.concat(victims);
	}
	if (victims.length > numberOfServers) {
		victims = victims.slice(0, numberOfServers);
	}

	if (ns.scriptRunning("start-servers2.js", "home")) {
		ns.tprint("There is already a server start running");
		return;
	}

	var threads = Math.floor(options.ram / ns.getScriptRam(SCRIPT));
	var cost = ns.getPurchasedServerCost(options.ram);
	reserveBudget(ns, "servers", numberOfServers * cost);

	ns.tprintf("Starting %d servers with %d GB ram (%d threads). Victims are %s.",
		numberOfServers, options.ram, threads, victims);
	ns.tprintf("This will cost %s per server, in total %s", formatMoney(cost),
		formatMoney(cost * numberOfServers));

	if (options.upgrade) {
		ns.tprintf("Removing existing smaller servers");
		removeSmallServers(ns, options.ram);
	} else {
		if (options.restart) {
			ns.tprintf("Freeing existing servers");
			freeServers(ns);
		}
	}
	ns.spawn("start-servers2.js", 1, options.ram, cost, SCRIPT, JSON.stringify(victims));
}

/** @param {NS} ns **/
function removeSmallServers(ns, ram) {
	for (var ii = 0; ii < ns.getPurchasedServerLimit(); ii++) {
		var hostname = SERVER_PREFIX + ii;
		if (ns.serverExists(hostname)) {
			ns.killall(hostname);
			if (ns.getServer(hostname).maxRam < ram) {
				ns.tprintf("Removing %s", hostname);
				ns.deleteServer(hostname);
			}
		}
	}
}

/** @param {NS} ns **/
function freeServers(ns) {
	for (var ii = 0; ii < ns.getPurchasedServerLimit(); ii++) {
		var hostname = SERVER_PREFIX + ii;
		if (ns.serverExists(hostname)) {
			ns.tprintf("Killing scripts on %s", hostname);
			ns.killall(hostname);
		}
	}
}