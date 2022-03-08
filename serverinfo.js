/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("%30s %10s %10s %10s", "Server", "Nuked", "Backdoor", "Hacklevel");
	for (var server of [ "CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "The-Cave", "w0r1d_d43m0n" ]) {
		var info = ns.getServer(server);
		ns.tprintf("%30s %10s %10s %10d", server,
			info.hasAdminRights ? "X" : "",
			info.backdoorInstalled ? "X" : "",
			info.requiredHackingSkill);
	}
}