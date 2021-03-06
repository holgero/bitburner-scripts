const FILES = [
	"bbselectcity.js",
	"bbskills.js",
	"blackops.js",
	"bladeburner.js",
	"bonus.js",
	"budget.js",
	"calculate-goals.js",
	"create-database1.js",
	"create-database2.js",
	"create-database3.js",
	"create-database4.js",
	"create-database5.js",
	"create-database6.js",
	"create-database7.js",
	"create-database.js",
	"database.js",
	"commit-crimes.js",
	"constants.js",
	"corporation.js",
	"corpinfo.js",
	"do-grow.js",
	"do-hack.js",
	"donate-faction.js",
	"do-weaken.js",
	"estimate.js",
	"extras.js",
	"evaluate-traders.js",
	"factiongoals.js",
	"git-pull.js",
	"hack-server.js",
	"helpers.js",
	"info.js",
	"instrument.js",
	"installbackdoor.js",
	"joinfactions.js",
	"joinbladeburner.js",
	"kill-world.js",
	"nodestart.js",
	"optimize-hack.js",
	"plan-augmentations.js",
	"playerinfo.js",
	"print_goals.js",
	"purchase-augmentations.js",
	"purchase-ram.js",
	"reset.js",
	"rscan.js",
	"rscan-spawn.js",
	"sell-all-stocks.js",
	"serverinfo.js",
	"servers-cost.js",
	"setactionlevels.js",
	"solve_contract2.js",
	"solve_contract3.js",
	"solve_contract4.js",
	"solve_contract5.js",
	"solve_contract.js",
	"start-hacknet2.js",
	"start-hacknet.js",
	"start-servers2.js",
	"start-servers.js",
	"test.js",
	"trader.js",
	"travel.js",
	"university.js",
	"whatdoineed.js",
	"workforcompany.js",
	"workforfaction.js",
	"workout.js",
	"writeprogram.js"];
const CONTRACTSOLVER = [
	"arrayjumpinggame.js",
	"compression.js",
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
const BASEURL = "https://raw.githubusercontent.com/holgero/bitburner-scripts/main/";

/** @param {NS} ns */
export async function main(ns) {
	var loop = FILES;
	if (ns.args.length) {
		loop = ns.args;
	}
	for (var file of loop) {
		ns.tprintf("Fetching %s", file);
		await ns.wget(BASEURL + file, file);
	}
	if (!ns.args.length) {
		for (var file of CONTRACTSOLVER) {
			ns.tprintf("Fetching %s", file);
			await ns.wget(BASEURL + "contractsolver/" + file, "/contractsolver/" + file);
		}
	}
}
