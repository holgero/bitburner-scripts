/** @param {NS} ns */
export async function main(ns) {
	const bitNodeN = ns.getPlayer().bitNodeN;
	const owned = ns.singularity.getOwnedSourceFiles();
	const thisNode = owned.find(a => a.n == bitNodeN);
	const thisLevel = thisNode ? thisNode.lvl : 0;
	var nextBitnode = bitNodeN;
	if (thisLevel >= 2) {
		// we are on the third run through this bitnode
		if (thisNode.n != 12) {
			// bitnode 12 is recursion, just stay until a manual intervention
			nextBitnode++;
		}
	}
	ns.tprintf("Destroying world daemon on bitNode %d.%d, proceeding on bitNode %d",
		bitNodeN, thisLevel, nextBitnode);
	for (var countDown = 10; countDown > 0; countDown--) {
		ns.tprintf("End of the world in %d seconds", countDown);
		await ns.sleep(1000);
	}
	if (ns.singularity.destroyW0r1dD43m0n(nextBitnode, "nodestart.js")) {
		ns.tprintf("World destroyed");
		return;
	}
	ns.tprintf("Failed to destroy world daemon");
}