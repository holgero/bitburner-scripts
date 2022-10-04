/** @param {NS} ns */
export async function main(ns) {
	var remaining = 0;
	var current = ns.bladeburner.getCurrentAction();
	if (current.type == "BlackOp") {
		ns.printf("%s %s is already running", current.type, current.name);
		return;
	}
	for (var op of ns.bladeburner.getBlackOpNames()) {
		if (ns.bladeburner.getActionCountRemaining("BlackOps", op) > 0) {
			remaining++;
			ns.printf("Remaining black operation %s", op);
			if (ns.bladeburner.getBlackOpRank(op) < ns.bladeburner.getRank()) {
				if (ns.bladeburner.getActionEstimatedSuccessChance("BlackOps", op)[0] > 0.6) {
					ns.printf("Can do BlackOps %s", op);
					if (ns.bladeburner.startAction("BlackOps", op)) {
						ns.tprintf("Executing BlackOps %s", op);
					}
				}
			}
		}
	}
	if (remaining == 0) {
		ns.tprintf("No more black operations to do, trying to destroy the world");
		ns.spawn("destroy-world.js");
	}
}