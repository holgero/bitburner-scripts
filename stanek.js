/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("sleep");
	for (var fragment of ns.stanek.activeFragments()) {
		if (fragment.type != 18) {
			await runMaxThreadsAndWait(ns, "stanek-charge.js", fragment.x, fragment.y);
		}
	}
}

/** @param {NS} ns **/
export async function runMaxThreadsAndWait(ns, script, ...args) {
	const availableRam = ns.getServerMaxRam("home") - ns.getServerUsedRam("home") - 32;
	const threads = Math.floor(availableRam / ns.getScriptRam(script));
	if (threads > 0) {
		ns.run(script, threads, ...args);
		while (ns.scriptRunning(script, "home")) {
			await ns.sleep(100);
		}
	} else {
		await ns.sleep(1000);
	}
}