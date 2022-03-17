/** @param {NS} ns **/
export async function main(ns) {
	ns.tprintf("City: %s, money: %d", ns.getPlayer().city, ns.getServerMoneyAvailable("home"));
	ns.travelToCity("Sector-12");
	ns.tprintf("City: %s, money: %d", ns.getPlayer().city, ns.getServerMoneyAvailable("home"));
	ns.travelToCity("Aevum");
	ns.tprintf("City: %s, money: %d", ns.getPlayer().city, ns.getServerMoneyAvailable("home"));
}