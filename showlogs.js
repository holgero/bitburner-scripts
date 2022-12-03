/** @param {NS} ns */
export async function main(ns) {
	const name = ns.args[0];
	for (var ii = 0; ii < 10; ii++) {
		const recent = ns.getRecentScripts().filter(a => a.filename == name);
		if (recent.length > 0) {
			ns.tprintf("%s", recent[0].logs.join("\n"));
			return;
		}
		await ns.sleep(500);
	}
	ns.tprintf("%s did not run recently", name);
}