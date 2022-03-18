import { formatMoney } from "helpers.js";

const SCRIPT_HOST = "pserv-0";
const MEMORY_NEEDED = 2048;

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["quiet", false]]);
	var player = ns.getPlayer();
	if (!player.hasCorporation) {
		if (!checkConditions(ns, player, options)) {
			return;
		}
	}
	// continue on SCRIPT_HOST
	var scriptHostProcessList = ns.ps(SCRIPT_HOST);
	await ns.scp("constants.js", SCRIPT_HOST);
	await ns.scp("helpers.js", SCRIPT_HOST);
	await ns.scp("corporation2.js", SCRIPT_HOST);
	ns.killall(SCRIPT_HOST);
	ns.exec("corporation2.js", SCRIPT_HOST, 1, JSON.stringify(scriptHostProcessList));
}

function checkConditions(ns, player, options) {
	var selfFund = player.bitNodeN != 3;
	if (!ns.serverExists(SCRIPT_HOST)) {
		if (!options.quiet) {
			ns.tprintf("Server %s to run corporation setup doesn't exist", SCRIPT_HOST);
		}
		return false;
	}
	if (ns.getServerMaxRam(SCRIPT_HOST) < MEMORY_NEEDED) {
		if (!options.quiet) {
			ns.tprintf("Server %s to run corporation setup has not enough memory (need: %d, has: %d)",
				SCRIPT_HOST, MEMORY_NEEDED, ns.getServerMaxRam(SCRIPT_HOST));
		}
		return false;
	}
	if (selfFund) {
		var money = ns.getServerMoneyAvailable("home");
		if (money < 150000000000) {
			if (!options.quiet) {
				ns.tprintf("Not enough money to create a corporation! (Have: %s)",
					formatMoney(money));
			}
			return false;
		}
	}
	return true;
}