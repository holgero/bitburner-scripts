/** @param {NS} ns **/
export async function main(ns) {
	var company = ns.args[0];
	var job = ns.args[1];

	if (ns.singularity.applyToCompany(company, job)) {
		ns.tprintf("Applied successfully at %s for %s job", company, job);
	}
	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "COMPANY" && current.companyName == company) {
		ns.printf("Already working for %s", current.companyName);
		toastCompletion(ns, company);
		return;
	}
	if (ns.singularity.workForCompany(company)) {
		ns.tprintf("Now working at %s as %s", company, job);
	}
}

function toastCompletion(ns, company) {
	const completion = ((100.0 * ns.singularity.getCompanyRep(company)) / 400000).toFixed(1);
	ns.toast("Company " + company + " completion: " + completion + " %", "success", 5000);
}