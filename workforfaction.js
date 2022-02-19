/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length != 3) {
		usage(ns);
		return;
	}
	var reputation = ns.args[0];
	var faction = ns.args[1];
	var worktype = ns.args[2];
	while (true) {
		var invites = ns.checkFactionInvitations();
		for (var ii=0; ii<invites.length; ii++) {
			if (invites[ii] == faction) {
				ns.joinFaction(invites[ii]);
			}
		}
		if (ns.workForFaction(faction, worktype)) {
			break;
		}
		if (ns.getFactionRep(faction) >= reputation) {
			break;
		}
		await ns.sleep(10000);
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: workforfaction.js [minrep] [faction] [worktype]")
}