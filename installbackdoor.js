/** @param {NS} ns */
export async function main(ns) {
	const path = JSON.parse(ns.args[0]);
	for (var host of path) {
		ns.connect(host);
	}
	await ns.installBackdoor();
	path.reverse();
	for (var host of path) {
		ns.connect(host);
	}
	ns.connect("home");
}