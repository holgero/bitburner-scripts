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
		["upgrade", false]]);

	var currentHackingSkill = ns.getPlayer().hacking;
	var numberOfServers = options.single ? 1 : ns.getPurchasedServerLimit();

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

	var threads = Math.floor(options.ram / ns.getScriptRam(SCRIPT));
	var cost = ns.getPurchasedServerCost(options.ram);

	ns.tprintf("Starting %d servers with %d GB ram (%d threads). Victims are %s.",
		numberOfServers, options.ram, threads, victims);
	ns.tprintf("This will cost %d m per server, in total %d m", Math.ceil(cost / 1000000),
		Math.ceil(cost * numberOfServers / 1000000));

	if (options.upgrade) {
		ns.tprintf("Removing existing smaller servers");
		removeSmallServers(ns, options.ram);
	} else {
		if (options.restart) {
			ns.tprintf("Freeing existing servers");
			freeServers(ns);
		}
	}
	ns.spawn("start-servers2.js", 1, options.ram, SCRIPT, JSON.stringify(victims));
}

/** @param {NS} ns **/
function removeSmallServers(ns, ram) {
	for (var ii = 0; ii < ns.getPurchasedServerLimit(); ii++) {
		var hostname = "pserv-" + ii;
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
		var hostname = "pserv-" + ii;
		if (ns.serverExists(hostname)) {
			ns.tprintf("Killing scripts on %s", hostname);
			ns.killall(hostname);
		}
	}
}