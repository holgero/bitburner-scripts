import { getAvailableMoney, getDatabase, formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([
		["hack", false],
	]);
	const database = getDatabase(ns);
	if (ns.getPurchasedServerLimit() <= 0) {
		ns.tprintf("Cannot buy any servers.");
		return;
	}
	if (ns.serverExists("pserv-0")) {
		ns.tprintf("Current memory of server pserv-0: %d GB", ns.getServerMaxRam("pserv-0"));
	}
	var money = getAvailableMoney(ns);
	if (database.bitnodemultipliers) {
		const multiplier = database.bitnodemultipliers.ServerMaxMoney;
		if (multiplier < 0.25 && !options.hack) {
			ns.tprintf("Reducing money to spend according to ServerMaxMoney (%s)", multiplier);
			money *= multiplier;
		}
	}
	const havePerServer = money / ns.getPurchasedServerLimit();
	var ram = 8;
	while (ns.getPurchasedServerCost(ram * 2) < havePerServer &&
		ram * 2 <= ns.getPurchasedServerMaxRam()) {
		ram *= 2;
	}
	ns.tprintf("Can afford %d servers with %d GB ram.", ns.getPurchasedServerLimit(), ram);
	printInfo(ns, ram);
	ram *= 2;
	if (ram> ns.getPurchasedServerMaxRam()) {
		return;
	}
	ns.tprintf("Next bigger servers:");
	printInfo(ns, ram);
	ram *= 2;
	if (ram > ns.getPurchasedServerMaxRam()) {
		return;
	}
	printInfo(ns, ram);
}

function printInfo(ns, ram) {
	ns.tprintf("%d GB ram, costs: %s total, %s per server",
		ram,
		formatMoney(ns.getPurchasedServerCost(ram) * ns.getPurchasedServerLimit()),
		formatMoney(ns.getPurchasedServerCost(ram)));
}