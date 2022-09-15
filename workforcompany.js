/** @param {NS} ns **/
export async function main(ns) {
	var company = ns.args[0];
	var job = ns.args[1];

	const current = ns.singularity.getCurrentWork();
	if (current != null && current.type == "COMPANY" && current.companyName == company) {
		ns.printf("Already working for %s", current.companyName);
		toastCompletion(ns, company);
		return;
	}
	for (var ii = 0; ii < 3; ii++) {
		ns.singularity.applyToCompany(company, job);
		if (ns.singularity.workForCompany(company)) {
			toastCompletion(ns, company);
			break;
		}
		await ns.sleep(5000);
	}
}

function toastCompletion(ns, company) {
	const completion = ((100.0 * ns.singularity.getCompanyRep(company)) / 400000).toFixed(1);
	ns.toast("Company " + company + " completion: " + completion + " %", "success", 5000);
}