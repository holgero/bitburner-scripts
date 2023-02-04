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
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "COMPANY" && current.companyName == options.company) {
		ns.printf("Already working for %s", current.companyName);
		toastCompletion(ns, options.company);
		return;
	}
	if (current != null && current.type == "GRAFTING") {
		ns.printf("Currently grafting %s", current.augmentation);
		return;
	}
	if (ns.singularity.workForCompany(options.company)) {
		ns.tprintf("Now working at %s", options.company);
	}
}

function toastCompletion(ns, company) {
	const completion = ((100.0 * ns.singularity.getCompanyRep(company)) / 400000).toFixed(1);
	ns.toast("Company " + company + " completion: " + completion + " %", ns.enums.ToastVariant.SUCCESS, 5000);
}