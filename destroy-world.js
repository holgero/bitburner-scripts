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

/* Source file order:
1 (obvious start)
4 (need automation)
complete 4 (need automation without penalty)
5 (intelligence)
8 (stock market)
3 (corporations)
complete 1 - 5 (gangs are easy)
9 (hackserver)
complete 9 (free hacknet server makes everything easier)
10 (sleeves)
complete 10 (get all sleeves)
7 (bladeburner automation)
complete 6 - 13 (12 is recursion, more than 3 could be usefull)
*/
/** @param {NS} ns */
function nextBitnode(ns, current, owned) {
	for (let next of [4, 5, 8, 3]) {
		if (current != next && !owned.find(a => a.n == next)) {
			return next;
		}
		if (next == 4) {
			const thisNode = owned.find(a => a.n == next);
			if (!thisNode || thisNode.lvl < 2 || (thisNode.lvl == 2 && current != next)) {
				return next;
			}
		}
	}
	for (let next = 1; next < 6; next++) {
		const thisNode = owned.find(a => a.n == next);
		if (!thisNode || thisNode.lvl < 2 || (thisNode.lvl == 2 && current != next)) {
			return next;
		}
	}
	for (let next of [9, 10, 7]) {
		if (current != next && !owned.find(a => a.n == next)) {
			return next;
		}
		if (next == 9 || next == 10) {
			const thisNode = owned.find(a => a.n == next);
			if (!thisNode || thisNode.lvl < 2 || (thisNode.lvl == 2 && current != next)) {
				return next;
			}
		}
	}
	for (let next = 6; next < 14; next++) {
		const thisNode = owned.find(a => a.n == next);
		if (!thisNode || thisNode.lvl < 2 || (thisNode.lvl == 2 && current != next)) {
			return next;
		}
	}
	return 12;
}