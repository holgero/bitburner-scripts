import { formatMoney } from "helpers.js";
import {
	getAvailable,
	getTotal,
	readBudget,
	cleanBudget,
	useBudget,
	unuseBudget,
	reserveBudget,
	releaseBudget
} from "budget.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["print", false],
		["clean", false],
		["reserve", 0],
		["release", 0],
		["unuse", 0],
		["use", 0]]);
	const ownerName = options._[0];

	if (options.reserve) {
		ns.tprintf("Reserving %s for %s", formatMoney(options.reserve), ownerName);
		await reserveBudget(ns, options.reserve, ownerName);
	}

	if (options.release) {
		ns.tprintf("Releasing %s from %s", formatMoney(options.release), ownerName);
		if (await releaseBudget(ns, options.release, ownerName)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.use) {
		ns.tprintf("Using %s from %s", formatMoney(options.use), ownerName);
		if (await useBudget(ns, options.use, ownerName)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.unuse) {
		ns.tprintf("Unusing %s from %s", formatMoney(options.unuse), ownerName);
		if (await unuseBudget(ns, options.unuse, ownerName)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.clean) {
		ns.tprintf("Cleaning budget");
		await cleanBudget(ns);
	}

	if (options.print) {
		const available = getAvailable(ns);
		const total = getTotal(ns);
		const current = ns.getServerMoneyAvailable("home");
		ns.tprintf("Current money: %s, available %s, total: %s",
			formatMoney(current), formatMoney(available), formatMoney(total));
		const budget = readBudget(ns);
		for (var owner of budget.owners) {
			ns.tprintf("%s holds %s and reserves %s",
				owner.name, formatMoney(owner.holding), formatMoney(owner.reserved));
		}
	}
}