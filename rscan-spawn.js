var known;
var path;
var hackingLevel;
var bestVictim;
var ownedPrograms = 0;
var hackScript = "hack-server.js";

/** @param {NS} ns **/
export async function main(ns) {
	ownedPrograms = +ns.args[1];
	ns.disableLog("scan");
	known = [];
	known.push("home");
	path = [];
	hackingLevel = ns.getHackingLevel();
	bestVictim = findBestVictim(ns);
	if (ns.args[0] == "nuke") {
		await traverse(ns, "home", nukeServer);
	} else if (ns.args[0] == "hack") {
		await traverse(ns, "home", runHack);
	} else if (ns.args[0] == "back") {
		await traverse(ns, "home", printBackdoorRoutes);
	}
}

/** @param {NS} ns **/
function findBestVictim(ns) {
	return "n00dles";
}

/** @param {NS} ns **/
async function traverse(ns, startServer, serverProc) {
	var servers = ns.scan(startServer);
	for (var i = 0; i < servers.length; i++) {
		var server = servers[i];
		if (known.includes(servers[i])) {
			continue;
		}
		known.push(servers[i]);
		path.push(server);
		await serverProc(ns, server);
		await traverse(ns, server, serverProc);
		path.pop();
	}
}

/** @param {NS} ns **/
async function nukeServer(ns, server) {
	if (ns.hasRootAccess(server)) {
		return;
	}
	var ports = ns.getServer(server).numOpenPortsRequired;
	if (ownedPrograms < ports) {
		return;
	}
	switch (ports) {
		case 5:
			ns.sqlinject(server);
		case 4:
			ns.httpworm(server);
		case 3:
			ns.relaysmtp(server);
		case 2:
			ns.ftpcrack(server);
		case 1:
			ns.brutessh(server);
	}
	ns.nuke(server);
}

/** @param {NS} ns **/
async function printBackdoorRoutes(ns, server) {
	if (server == "CSEC" ||
		server == "I.I.I.I" ||
		server == "avmnite-02h" ||
		server == "The-Cave" ||
		server == "w0r1d_d43m0n" ||
		// server == "fulcrumassets" ||
		server == "run4theh111z") {
		if (!ns.hasRootAccess(server)) {
			return;
		}
		if (ns.getServer(server).requiredHackingSkill <= hackingLevel) {
			if (!ns.getServer(server).backdoorInstalled) {
				ns.spawn("installbackdoor.js", 1, JSON.stringify(path));
			}
		}
	}
}

/** @param {NS} ns **/
async function runHack(ns, server) {
	if (!ns.hasRootAccess(server)) {
		return;
	}
	var availableRam = ns.getServer(server).maxRam - ns.getServer(server).ramUsed;
	var neededRam = ns.getScriptRam(hackScript);
	var threads = Math.floor(availableRam / neededRam);
	var victim = server;
	if (ns.getServer(server).requiredHackingSkill > hackingLevel ||
		ns.getServer(server).moneyMax < 1000000) {
		victim = bestVictim;
	}
	if (threads > 0) {
		await ns.scp(hackScript, server);
		ns.exec(hackScript, server, threads, victim);
	}
}