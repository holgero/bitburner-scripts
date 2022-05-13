import { formatMoney } from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.serverExists("pserv-0")) {
		ns.tprintf("Current memory of server pserv-0: %d GB", ns.getServerMaxRam("pserv-0"));
	}
	var money = ns.getServerMoneyAvailable("home");
	var havePerServer = money / ns.getPurchasedServerLimit();
	var ram = 64;
	for (var i = 0; i < 16; i++) {
		if (ns.getPurchasedServerCost(ram) > havePerServer) {
			break;
		}
		ram *= 2;
		if (ram > ns.getPurchasedServerMaxRam()) {
			break;
		}
	}
	ram = ram / 2;
	ns.tprintf("Can afford %d servers with %d GB ram.", ns.getPurchasedServerLimit(), ram);
	printInfo(ns, ram);
	ns.tprintf("Next bigger servers:");
	ram = ram * 2;
	if (ram > ns.getPurchasedServerMaxRam()) return;
	printInfo(ns, ram);
	ram = ram * 2;
	if (ram > ns.getPurchasedServerMaxRam()) return;
	printInfo(ns, ram);
}

function printInfo(ns, ram) {
	ns.tprintf("%d GB ram, costs: %s total, %s per server",
		ram,
		formatMoney(ns.getPurchasedServerCost(ram)*ns.getPurchasedServerLimit()),
		formatMoney(ns.getPurchasedServerCost(ram)));
}