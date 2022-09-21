/** @param {NS} ns */
export async function main(ns) {
	for (var countDown = 10; countDown >0; countDown--) {
		ns.tprintf("End of the world in %d seconds", countDown);
		await ns.sleep(1000);
	}
	const nextBitnode = ns.getPlayer().bitNodeN+1;
	ns.singularity.destroyW0r1dD43m0n(nextBitnode, "nodestart.js");
}