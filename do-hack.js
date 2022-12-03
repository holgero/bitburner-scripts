/** @param {NS} ns **/
export async function main(ns) {
	ns.disableLog("ALL");
	const target = ns.args[0];

	while (true) {
		await ns.hack(target);
	}
}