const FILES = [
	"bbactions.js",
	"bbselectcity.js",
	"bbskills.js",
	"bb-investigate.js",
	"blackops.js",
	"bladeaction.js",
	"bladeburner.js",
	"budget.js",
	"budget-main.js",
	"build-hacknet.js",
	"calculate-goals.js",
	"calculate-victims.js",
	"clean-files.js",
	"destroy-world.js",
	"challenges.js",
	"check-end.js",
	"commit-crimes.js",
	"completion.js",
	"constants.js",
	"corporation.js",
	"corpstart.js",
	"corpinfo.js",
	"do-grow.js",
	"do-hack.js",
	"donate-faction.js",
	"do-weaken.js",
	"employment.js",
	"estimate.js",
	"extras.js",
	"evaluate-traders.js",
	"factionaction.js",
	"factiongoals.js",
	"ganginfo.js",
	"gangs.js",
	"git-pull.js",
	"governors.js",
	"graft-augmentation.js",
	"hack-server.js",
	"hacknetcost.js",
	"helpers.js",
	"info.js",
	"instrument.js",
	"installbackdoor.js",
	"joincovenant.js",
	"joinnitesec.js",
	"joinfactions.js",
	"joinbladeburner.js",
	"list-graft-augmentations.js",
	"nodestart.js",
	"optimize-hack.js",
	"plan-augmentations.js",
	"playerinfo.js",
	"print_goals.js",
	"purchase-stock-api.js",
	"purchase-augmentations.js",
	"purchase-cores.js",
	"purchase-ram.js",
	"purchase-sleeve-augs.js",
	"reset.js",
	"rback.js",
	"rhack.js",
	"rnuke.js",
	"rkill.js",
	"rscan.js",
	"rscan-spawn.js",
	"sell-all-stocks.js",
	"servercost.js",
	"serverinfo.js",
	"showlogs.js",
	"skill-helper.js",
	"solve_contract2.js",
	"solve_contract3.js",
	"solve_contract4.js",
	"solve_contract5.js",
	"solve_contract.js",
	"sleeves.js",
	"spend-hashes.js",
	"stanek.js",
	"stanek-charge.js",
	"fill-stanek.js",
	"test.js",
	"trader.js",
	"trader2.js",
	"travel.js",
	"university.js",
	"upgrade-servers.js",
	"workforcompany.js",
	"workforfaction.js",
	"workout.js",
	"writeprogram.js"];
const CONTRACTSOLVER = [
	"arrayjumpinggame.js",
	"bigintsquare.js",
	"compression.js",
	"encryption.js",
	"generateipaddress.js",
	"graphcoloring.js",
	"gridpaths.js",
	"hammingcode.js",
	"largestprimefactor.js",
	"mergeoverlappingintervals.js",
	"minimalpathsum.js",
	"sanitizeparenthesis.js",
	"spiralizematrix.js",
	"stocktrader.js",
	"subarraysum.js",
	"totalwaystosum.js",
	"validexpressions.js"];
const DATABASE = [
	"create.js",
	"create-schema.js",
	"currentnode.js",
	"owned-augmentations.js",
	"factions.js",
	"factions-info.js",
	"augmentations.js",
	"augmentations-types.js",
	"augmentations-requirements.js",
	"sourcefiles.js",
	"multipliers.js",
	"features.js",
];

const BASEURL = "https://codeberg.org/holgero/bitburner-scripts/raw/branch/main/";

/** @param {NS} ns */
export async function main(ns) {
	var loop = FILES;
	if (ns.args.length) {
		loop = ns.args;
	}
	for (var file of loop) {
		await fetch(ns, BASEURL + file, file);
	}
	if (!ns.args.length) {
		for (var file of CONTRACTSOLVER) {
			await fetch(ns, BASEURL + "contractsolver/" + file, "/contractsolver/" + file);
		}
		for (var file of DATABASE) {
			await fetch(ns, BASEURL + "database/" + file, "/database/" + file);
		}
	}
}

/** @param {NS} ns */
async function fetch(ns, url, file) {
	ns.tprintf("Fetching %s", file);
	const result = await ns.wget(url, file);
	if (!result) {
		ns.tprintf("Failed to fetch %s from URL %s", file, url);
		ns.exit();
	}
}
