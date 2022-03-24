/** @param {NS} ns **/
export async function main(ns) {
	var faction = ns.args[0];
	var worktype = ns.args[1];
	var wantedFactions = JSON.parse(ns.args[2]);
	var focus = JSON.parse(ns.args[3]);
	for (var ii=0; ii<3; ii++) {
		var invites = ns.checkFactionInvitations();
		for (var invite of invites) {
			if (invite == faction || wantedFactions.includes(invite)) {
				ns.joinFaction(invite);
			}
		}
		if (ns.workForFaction(faction, worktype, focus)) {
			break;
		}
		await ns.sleep(5000);
	}
}