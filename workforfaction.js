/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length != 2) {
		usage(ns);
		return;
	}
	var faction = ns.args[0];
	var worktype = ns.args[1];
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
		await ns.sleep(10000);
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: workforfaction.js [faction] [worktype]")
}