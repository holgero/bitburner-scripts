/** @param {NS} ns **/
export async function main(ns) {
	var maxRam = +ns.args[0];
	var money = ns.getServerMoneyAvailable("home");

	while (ns.getServerMaxRam("home") < maxRam) {
		if (money < ns.getUpgradeHomeRamCost()) {
			break;
		}
		if (!ns.upgradeHomeRam()) {
			break;
		}
	}
}