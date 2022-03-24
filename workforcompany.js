/** @param {NS} ns **/
export async function main(ns) {
	var company = ns.args[0];
	var job = ns.args[1];
	var wantedFactions = JSON.parse(ns.args[2]);
	var focus = JSON.parse(ns.args[3]);

	for (var ii = 0; ii < 3; ii++) {
		var invites = ns.checkFactionInvitations();
		for (var invite of invites) {
			if (invite == company || wantedFactions.includes(invite)) {
				ns.joinFaction(invite);
			}
		}
		ns.applyToCompany(company, job);
		if (ns.workForCompany(company, focus)) {
			break;
		}
		await ns.sleep(5000);
	}
}