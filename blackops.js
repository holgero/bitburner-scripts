/** @param {NS} ns */
export async function main(ns) {
	var remaining = 0;
	for (var op of ns.bladeburner.getBlackOpNames()) {
		if (ns.bladeburner.getActionCountRemaining("BlackOps", op) > 0) {
			remaining++;
			ns.printf("Remaining black operation %s", op);
			if (ns.bladeburner.getBlackOpRank(op) < ns.bladeburner.getRank()) {
				if (ns.bladeburner.getActionEstimatedSuccessChance("BlackOps", op)[0] > 0.6) {
					ns.printf("Can do BlackOps %s", op);
					if (ns.bladeburner.startAction("BlackOps", op)) {
						ns.tprintf("Executing BlackOps %s", op);
						var time = ns.bladeburner.getActionTime("BlackOps", op);
						var bonus = ns.bladeburner.getBonusTime();
						if (time < bonus) {
							time = time / 5;
						} else {
							time = time - bonus;
						}
						await ns.sleep(time * 1.05);
						await ns.sleep(1000);
						break;
					}
				}
			}
		}
	}
	if (remaining == 0) {
		ns.tprintf("No more black operations to do, trying to destroy the world in 10 s");
		ns.spawn("destroy-world.js");
	}
}