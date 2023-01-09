import * as c from "constants.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["dry-run", false],
		["bitNodeN", ns.getPlayer().bitNodeN]]);
	const bitNodeN = options.bitNodeN;
	const owned = ns.singularity.getOwnedSourceFiles();
	const nextNode = nextBitnode(ns, bitNodeN, owned);
	const thisNode = owned.find(a => a.n == bitNodeN);
	const thisLevel = thisNode ? thisNode.lvl : 0;
	ns.tprintf("Destroying world daemon on bitNode %d.%d, proceeding on bitNode %d",
		bitNodeN, thisLevel, nextNode);
	if (options["dry-run"]) {
		return;
	}
	for (var countDown = 10; countDown > 0; countDown--) {
		ns.tprintf("End of the world in %d seconds", countDown);
		await ns.sleep(1000);
	}
	if (ns.singularity.destroyW0r1dD43m0n(nextNode, "nodestart.js")) {
		ns.tprintf("World destroyed");
		return;
	}
	ns.tprintf("Failed to destroy world daemon");
}

/** @param {NS} ns */
function nextBitnode(ns, current, owned) {
	const thisNode = owned.find(a => a.n == current);
	if (!thisNode || thisNode.lvl < 2) {
		return current;
	}
	if (thisNode.n == 12 && thisNode.lvl < 50) {
		return current;
	}
	owned.sort((a, b) => a.n - b.n);
	for (var ii = 0; ii < owned.length; ii++) {
		if (owned[ii].n > ii + 1) {
			return ii + 1;
		}
		if (owned[ii].n != current && owned[ii].lvl < 3) {
			return ii + 1;
		}
	}
	const nextOne = owned.length + 1;
	if (nextOne == c.BLADEBURNER_NODES[0]) {
		// change order of execution for bladeburner nodes, the second one gives the API
		return c.BLADEBURNER_NODES[1];
	}

	return nextOne;
}