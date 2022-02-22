const SCRIPT = "hack-server.script";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length < 1) {
		return usage(ns);
	}
	var ram = +ns.args[0];
	var force = ns.args.length>1 ? ns.args[1] : false;
	
	var potentialVictims = [
		"syscore",  "zb-institute", "solaris", "lexo-corp", "alpha-ent",
		"rho-construction", "catalyst", "aevum-police", "summit-uni", "netlink",
		"millenium-fitness", "comptek", "rothman-uni", "johnson-ortho", "omega-net",
		"crush-fitness", "silver-helix", "phantasy", "iron-gym", "max-hardware",
		"zer0", "harakiri-sushi", "neo-net", "hong-fang-tea", "nectar-net",
		"joesguns", "sigma-cosmetics", "foodnstuff" ];

	var currentHackingSkill = ns.getPlayer().hacking;
	var victims = potentialVictims.filter(
		victim => ns.getServer(victim).hasAdminRights &&
			(ns.getServer(victim).requiredHackingSkill <= currentHackingSkill));
	victims.sort( (a,b) => ns.getServer(a).moneyMax - ns.getServer(b).moneyMax);
	if (victims.length > ns.getPurchasedServerLimit()) {
		victims = victims.slice(victims.length-ns.getPurchasedServerLimit());
	}

	var threads = Math.floor(ram/ns.getScriptRam(SCRIPT));
	var cost = ns.getPurchasedServerCost(ram);

	ns.tprintf("Starting %d servers with %d GB ram (%d threads). Victims are %s.",
		ns.getPurchasedServerLimit(), ram, threads, victims);
	ns.tprintf("This will cost %d m per server, in total %d m", Math.ceil(cost/1000000),
		Math.ceil(cost*ns.getPurchasedServerLimit()/1000000) );
	
	if (force) {
		ns.tprintf("Removing existing smaller servers");
		removeSmallServers(ns, ram);
	} else {
		ns.tprintf("Freeing existing servers");
		freeServers(ns);
	}
	ns.spawn("start-servers2.js", 1, ram, threads, SCRIPT, JSON.stringify(victims));
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprintf("run start-servers.js [memory in GB] [?force]");
	return 1;
}

/** @param {NS} ns **/
async function removeSmallServers(ns, ram) {
	for (var ii=0; ii<ns.getPurchasedServerLimit(); ii++) {
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
async function freeServers(ns) {
	for (var ii=0; ii<ns.getPurchasedServerLimit(); ii++) {
		var hostname = "pserv-" + ii;
		if (ns.serverExists(hostname)) {
			ns.tprintf("Killing scripts on %s", hostname);
			ns.killall(hostname);
		}
	}
}