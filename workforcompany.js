/** @param {NS} ns **/
export async function main(ns) {
	var company = ns.args[0];
	var job = ns.args[1];

	ns.applyToCompany(company, job);
	ns.workForCompany(company, true);
}