/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length != 4) {
		usage(ns);
		return;
	}
	var reputation = ns.args[0];
	var faction = ns.args[1];
	var worktype = ns.args[2];
	var wantedFactions = JSON.parse(ns.args[3]);
	for (var ii=0; ii<3; ii++) {
		var invites = ns.checkFactionInvitations();
		for (var invite of invites) {
			if (invite == faction || wantedFactions.includes(invite)) {
				ns.joinFaction(invite);
			}
		}
		if (ns.workForFaction(faction, worktype)) {
			break;
		}
		if (ns.getFactionRep(faction) >= reputation) {
			break;
		}
		await ns.sleep(5000);
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: workforfaction.js [minrep] [faction] [worktype] [wantedfactions]")
}