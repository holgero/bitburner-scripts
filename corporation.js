const SCRIPT_HOST = "pserv-0";

/** @param {NS} ns **/
export async function main(ns) {
	if (!ns.serverExists(SCRIPT_HOST) ||
		!(ns.getServerMaxRam(SCRIPT_HOST) >= ns.getScriptRam("corporation2.js"))) {
		if (!(ns.getServerMaxRam("home") >= ns.getScriptRam("corporation2.js"))) {
			// neither here nor on the dedicated server enough ram: give up.
			return;
		}
		ns.spawn("corporation2.js", 1, ...ns.args);
	}
	// continue on SCRIPT_HOST
	var scriptHostProcessList = ns.ps(SCRIPT_HOST);
	await ns.scp("constants.js", SCRIPT_HOST);
	await ns.scp("helpers.js", SCRIPT_HOST);
	await ns.scp("corporation2.js", SCRIPT_HOST);
	ns.killall(SCRIPT_HOST);
	ns.exec("corporation2.js", SCRIPT_HOST, 1,
		"--restart", JSON.stringify(scriptHostProcessList), ...ns.args);
}