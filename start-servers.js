const SCRIPT = "hack-server.script";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length != 1) {
		return usage(ns);
	}
	var ram = +ns.args[0];
	
	var potentialVictims = [
		"syscore",  "zb-institute", "solaris", "lexo-corp", "alpha-ent",
		"rho-construction", "catalyst", "aevum-police", "summit-uni", "netlink",
		"millenium-fitness", "comptek", "rothman-uni", "johnson-ortho", "omega-net",
		"crush-fitness", "silver-helix", "phantasy", "iron-gym", "max-hardware",
		"zer0", "harakiri-sushi", "neo-net", "hong-fang-tea", "nectar-net",
		"joesguns", "sigma-cosmetics", "foodnstuff" ];

	var currentHackingSkill = ns.getPlayer().hacking;
	var victims = potentialVictims.filter(
		victim => ns.getServer(victim).requiredHackingSkill <= currentHackingSkill);
	victims.sort( (a,b) => ns.getServer(a).moneyMax - ns.getServer(b).moneyMax);
	victims.reverse();
	if (victims.length > ns.getPurchasedServerLimit()) {
		victims = victims.slice(0, ns.getPurchasedServerLimit());
	}

	var threads = Math.floor(ram/ns.getScriptRam(SCRIPT));
	var cost = ns.getPurchasedServerCost(ram);

	ns.tprintf("Starting %d servers with %d GB ram (%d threads). Victims are %s.",
		ns.getPurchasedServerLimit(), ram, threads, victims);
	ns.tprintf("This will cost %d m per server, in total %d m", Math.ceil(cost/1000000),
		Math.ceil(cost*ns.getPurchasedServerLimit()/1000000) );
	
	ns.spawn("start-servers2.js", 1, ram, threads, SCRIPT, JSON.stringify(victims));
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprintf("run start-servers.js [memory in GB]");
	return 1;
}