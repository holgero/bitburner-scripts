const VICTIMS = [
	"syscore", "zb-institute", "solaris", "lexo-corp", "alpha-ent",
	"rho-construction", "catalyst", "aevum-police", "summit-uni", "netlink",
	"millenium-fitness", "rothman-uni", "johnson-ortho", "omega-net",
	"crush-fitness", "silver-helix", "phantasy", "iron-gym", "max-hardware",
	"zer0", "harakiri-sushi", "neo-net", "hong-fang-tea", "nectar-net",
	"joesguns", "sigma-cosmetics", "foodnstuff"];

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["hack", false]]);
	const player = ns.getPlayer();

	var victims = VICTIMS.filter(
		victim => ns.getServer(victim).hasAdminRights &&
			(ns.getServer(victim).requiredHackingSkill <= player.skills.hacking));
	victims.sort((a, b) => ns.getServer(a).moneyMax - ns.getServer(b).moneyMax);
	if (options.hack) {
		victims = ["foodnstuff"];
	}
	ns.write("victims.txt", JSON.stringify(victims), "w");
}
