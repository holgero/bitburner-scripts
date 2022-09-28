import { canRunAction } from "./helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	const options = ns.flags([
		["company", "NWO"],
		["job", "IT"],
		["apply", false],
		["work", false]]);

	if (options.apply && ns.singularity.applyToCompany(options.company, options.job)) {
		ns.tprintf("Applied successfully at %s for %s job", options.company, options.job);
	}
	if (!options.work) {
		return;
	}
	if (!canRunAction(ns, "work")) {
		ns.printf("Cannot work at the moment");
		return;
	}
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "COMPANY" && current.companyName == options.company) {
		ns.printf("Already working for %s", current.companyName);
		toastCompletion(ns, options.company);
		return;
	}
	if (ns.singularity.workForCompany(options.company)) {
		ns.tprintf("Now working at %s", options.company);
	}
}

function toastCompletion(ns, company) {
	const completion = ((100.0 * ns.singularity.getCompanyRep(company)) / 400000).toFixed(1);
	ns.toast("Company " + company + " completion: " + completion + " %", "success", 5000);
}