import { formatMoney } from "helpers.js";

import {
	getAvailable,
	getTotal,
	readBudget,
	cleanBudget,
	getBudget,
	getHolding,
	setHolding,
	useBudget,
	unuseBudget,
	reserveBudget,
	releaseBudget,
	deleteBudget
} from "budget.js";

/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([
		["print", false],
		["clean", false],
		["delete", false],
		["getBudget", false],
		["getHolding", false],
		["setHolding", 0],
		["reserve", 0],
		["release", 0],
		["unuse", 0],
		["use", 0]]);
	const ownerName = options._[0];

	if (options.reserve) {
		ns.tprintf("Reserving %s for %s", formatMoney(options.reserve), ownerName);
		reserveBudget(ns, ownerName, options.reserve);
	}

	if (options.release) {
		ns.tprintf("Releasing %s from %s", formatMoney(options.release), ownerName);
		if (releaseBudget(ns, ownerName, options.release)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.use) {
		ns.tprintf("Using %s from %s", formatMoney(options.use), ownerName);
		if (useBudget(ns, ownerName, options.use)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.unuse) {
		ns.tprintf("Unusing %s from %s", formatMoney(options.unuse), ownerName);
		if (unuseBudget(ns, ownerName, options.unuse)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.getBudget) {
		ns.tprintf("Budget for %s is %s (%s)", ownerName, getBudget(ns, ownerName), formatMoney(getBudget(ns, ownerName)));
	}

	if (options.setHolding) {
		ns.tprintf("Set holding for %s to %s", ownerName, formatMoney(options.setHolding));
		if (setHolding(ns, ownerName, options.setHolding)) {
			ns.tprintf("Success");
		} else {
			ns.tprintf("Failed!");
		}
	}

	if (options.getHolding) {
		ns.tprintf("Holding for %s is %s", ownerName, formatMoney(getHolding(ns, ownerName)));
	}

	if (options.delete) {
		ns.tprintf("Deleting budget for %s", ownerName);
		deleteBudget(ns, ownerName);
	}

	if (options.clean) {
		ns.tprintf("Cleaning budget");
		cleanBudget(ns);
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