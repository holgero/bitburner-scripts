/** @param {NS} ns */
export async function main(ns) {
	const path = JSON.parse(ns.args[0]);
	for (var host of path) {
		ns.connect(host);
		ns.tprintf("Connected to %s", host);
	}
	ns.tprintf("Installing backdoor on %s", host);
	await ns.installBackdoor();
	ns.tprintf("Backdoor installed");
	path.reverse();
	for (var host of path) {
		ns.connect(host);
	}
	ns.connect("home");
}