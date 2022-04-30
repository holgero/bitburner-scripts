var known;
var path;
var hackingLevel;
var bestVictim;
var hackScript = "hack-server.js";
var hackSelf = true;

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["quiet", false]]);
	if (ns.args.length == 0) {
		usage(ns);
		return;
	}
	ns.disableLog("scan");
	known = ns.getPurchasedServers();
	known.push("home");
	path = [];
	hackingLevel = ns.getHackingLevel();
	bestVictim = findBestVictim(ns);
	if (ns.args[0] == "nuke") {
		await traverse(ns, options, "home", nukeServer);
	} else if (ns.args[0] == "money") {
		await traverse(ns, options, "home", moneyInfo);
	} else if (ns.args[0] == "hack") {
		await traverse(ns, options, "home", runHack);
	} else if (ns.args[0] == "hackhack") {
		bestVictim = "foodnstuff";
		hackScript = "do-hack.js";
		hackSelf = false;
		await traverse(ns, options, "home", runHack);
	} else if (ns.args[0] == "files") {
		await traverse(ns, options, "home", checkFiles);
	} else if (ns.args[0] == "route") {
		await traverse(ns, options, "home", printRoute);
	} else if (ns.args[0] == "back") {
		await traverse(ns, options, "home", printBackdoorRoutes);
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: run rscan.js [nuke|money|hack|hackhack|files|route|back]");
}

/** @param {NS} ns **/
function findBestVictim(ns) {
	var victims = [ "megacorp", "ecorp", "b-and-a", "nwo", "clarkinc", "4sigma", "kuai-gong",
		"blade", "omnitek", "fulcrumtech", "deltaone", "global-pharm", "zeus-med",
		"nova-med", "univ-energy", "aerocorp", "unitalife", "stormtech", "zb-institute",
		"solaris", "lexo-corp", "alpha-ent", "rho-construction", "syscore", "catalyst",
		"aevum-police", "summit-uni", "netlink", "rothman-uni", "the-hub",
		"johnson-ortho",  "omega-net", "crush-fitness", "silver-helix", "phantasy",
		"iron-gym", "max-hardware", "joesguns"];

        for (var ii=0; ii<victims.length; ii++) {
                if (ns.getServerRequiredHackingLevel(victims[ii]) < hackingLevel
					&& ns.hasRootAccess(victims[ii])) {
                    return victims[ii];
                }
        }
        return "n00dles";
}

/** @param {NS} ns **/
async function traverse(ns, options, startServer, serverProc) {
	var servers = ns.scan(startServer);
	for (var i=0; i< servers.length; i++) {
		var server = servers[i];
		if (known.includes(servers[i])) {
			continue;
		}
		known.push(servers[i]);
		path.push(server);
		await serverProc(ns, options, server);
		await traverse(ns, options, server, serverProc);
		path.pop();
	}
}

/** @param {NS} ns **/
async function nukeServer(ns, options, server) {
	if (ns.hasRootAccess(server)) {
		if (!options.quiet) ns.tprint("already have access to ", server);
		return;
	}
	var nports = ns.getServerNumPortsRequired(server);
	if (nports>0) {
		if (nports>1) {
			if (nports>2) {
				if (nports>3) {
					if (nports>4) {
						if (nports>5) {
							ns.tprint("too many ports required for ", server, " (", nports, ")");
							return;
						}
						if (ns.fileExists("SQLInject.exe", "home")) {
							ns.sqlinject(server);
						} else {
							if (!options.quiet) ns.tprint("need SQLInject.exe for ", server, " (", nports, ")");
							return;
						}
					}
					if (ns.fileExists("HTTPWorm.exe", "home")) {
						ns.httpworm(server);
					} else {
						if (!options.quiet) ns.tprint("need HTTPWorm.exe for ", server, " (", nports, ")");
						return;
					}
				}
				if (ns.fileExists("relaySMTP.exe", "home")) {
					ns.relaysmtp(server);
				} else {
					if (!options.quiet) ns.tprint("need relaySMTP.exe for ", server, " (", nports, ")");
					return;
				}
			}
			if (ns.fileExists("FTPCrack.exe", "home")) {
				ns.ftpcrack(server);
			} else {
				if (!options.quiet) ns.tprint("need FTPCrack.exe for ", server, " (", nports, ")");
				return;
			}
		}
		if (ns.fileExists("BruteSSH.exe", "home")) {
			ns.brutessh(server);
		} else {
			if (!options.quiet) ns.tprint("need BruteSSH.exe for ", server, " (", nports, ")");
			return;
		}
	}
	ns.nuke(server);
	ns.tprint("nuked ", server);
}

/** @param {NS} ns **/
async function moneyInfo(ns, options, server) {
	if (ns.getServerRequiredHackingLevel(server) > hackingLevel) {
		return;
	}
	var money = Math.floor(ns.getServerMaxMoney(server) / 1000000);
	if (money < 1) {
		return;
	}
	ns.tprintf("%30s %10d m", server, money);
}

/** @param {NS} ns **/
async function checkFiles(ns, options, server) {
	var contracts = ns.ls(server, ".cct");
	if (contracts.length > 0) {
		ns.tprint(contracts);
		await printRoute(ns, server);
	}
}

/** @param {NS} ns **/
async function printBackdoorRoutes(ns, options, server) {
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
		if (ns.getServerRequiredHackingLevel(server) <= hackingLevel) {
			if (!ns.getServer(server).backdoorInstalled) {
				for (var ii=0; ii<path.length; ii++) {
					ns.connect(path[ii]);
				}
				await ns.installBackdoor();
				for (var ii=path.length-2; ii>0; ii--) {
					ns.connect(path[ii]);
				}
				ns.connect("home");
				if (ns.getServer(server).backdoorInstalled) {
					ns.tprintf("installed backdoor on %s", server);
				}
			}
			if (!ns.getServer(server).backdoorInstalled) {
				ns.tprintf("home; connect %s; backdoor", path.join("; connect "));
			}
		}
	}
}

/** @param {NS} ns **/
async function printRoute(ns, options, server) {
	ns.tprint("home; connect ", path.join("; connect "));
}

/** @param {NS} ns **/
async function runHack(ns, options, server) {
	if (!ns.hasRootAccess(server)) {
			return;
	}
	ns.scriptKill(hackScript,server);
	var availableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
	var neededRam = ns.getScriptRam(hackScript);
	var threads = Math.floor(availableRam/neededRam);
	var victim = server;
	if (ns.getServerRequiredHackingLevel(server) > hackingLevel ||
		ns.getServerMaxMoney(server) < 1000000 ||
		!hackSelf) {
		victim = bestVictim;
	}
	if (threads > 0) {
		await ns.scp(hackScript, server);
		ns.exec(hackScript, server, threads, victim);
		if (!options.quiet) ns.tprint("Utilising ", server, " to hack " + victim + " with ", threads, " threads.");
	}
}