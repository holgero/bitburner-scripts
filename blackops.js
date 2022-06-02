/** @param {NS} ns */
export async function main(ns) {
	for (var op of ns.bladeburner.getBlackOpNames()) {
		if (ns.bladeburner.getBlackOpRank(op) < ns.bladeburner.getRank() &&
			ns.bladeburner.getActionCountRemaining("BlackOps", op) > 0) {
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
					await ns.sleep(time);
					await ns.sleep(1000);
					break;
				}
			}
		}
	}
}