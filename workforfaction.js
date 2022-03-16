/** @param {NS} ns **/
export async function main(ns) {
	var reputation = ns.args[0];
	var faction = ns.args[1];
	var worktype = ns.args[2];
	var wantedFactions = JSON.parse(ns.args[3]);
	var focus = JSON.parse(ns.args[4]);
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
		if (ns.getFactionRep(faction) >= reputation) {
			break;
		}
		await ns.sleep(5000);
	}
}