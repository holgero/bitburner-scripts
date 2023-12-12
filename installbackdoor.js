/** @param {NS} ns */
export async function main(ns) {
	const path = JSON.parse(ns.args[0]);
	for (var host of path) {
		ns.singularity.connect(host);
		ns.printf("Connected to %s", host);
	}
	ns.printf("Installing backdoor on %s", host);
	await ns.singularity.installBackdoor();
	ns.tprintf("Backdoor installed on %s", host);
	path.reverse();
	for (var host of path) {
		ns.singularity.connect(host);
	}
	ns.singularity.connect("home");
}