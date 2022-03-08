/** @param {NS} ns **/
export async function main(ns) {
	var money = ns.getServerMoneyAvailable("home");
	var havePerServer = money / ns.getPurchasedServerLimit();
	var ram = 64;
	for (var i = 0; i < 16; i++) {
		if (ns.getPurchasedServerCost(ram) > havePerServer) {
			break;
		}
		ram *= 2;
	}
	ram = ram / 2;
	ns.tprintf("Can afford %d servers with %d GB ram.", ns.getPurchasedServerLimit(), ram);
	printInfo(ns, ram);
	ns.tprintf("Next bigger servers:");
	ram = ram * 2;
	printInfo(ns, ram);
	ram = ram * 2;
	printInfo(ns, ram);
}

function printInfo(ns, ram) {
	ns.tprintf("%d GB ram, costs: %s total, %s per server",
		ram,
		formatMoney(ns.getPurchasedServerCost(ram)*ns.getPurchasedServerLimit()),
		formatMoney(ns.getPurchasedServerCost(ram)));
}

function formatMoney(amount) {
	if (amount > 1000) {
		if (amount > 1000000) {
			if (amount > 1000000000) {
				if (amount > 1000000000000) {
					return (amount / 1000000000000).toFixed(3) + " t";
				}
				return (amount / 1000000000).toFixed(3) + " b";
			}
			return (amount / 1000000).toFixed(3) + " m";
		}
		return (amount / 1000).toFixed(3) + " k";
	}
	return amount.toFixed(3) + "  ";
}