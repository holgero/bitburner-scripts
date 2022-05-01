const FILES = [
	"bonus.js",
	"calculate-goals.js",
	"create-database1.js",
	"create-database2.js",
	"create-database3.js",
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
	"hack-server.js",
	"helpers.js",
	"info.js",
	"instrument.js",
	"nodestart.js",
	"optimize-hack.js",
	"plan-augmentations.js",
	"playerinfo.js",
	"print_goals.js",
	"purchase-augmentations.js",
	"purchase-ram.js",
	"reset.js",
	"rscan.js",
	"sell-all-stocks.js",
	"serverinfo.js",
	"servers-cost.js",
	"solve_contract2.js",
	"solve_contract.js",
	"start-hacknet2.js",
	"start-hacknet.js",
	"start-servers2.js",
	"start-servers.js",
	"test.js",
	"travel.js",
	"upgradehomeserver.js",
	"workforcompany.js",
	"workforfaction.js",
	"workout.js",
	"writeprogram.js"];
const CONTRACTSOLVER = [
	"arrayjumpinggame.js",
	"generateipaddress.js",
	"gridpaths2.js",
	"gridpaths.js",
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
		ns.cd("contractsolver");
		for (var file of CONTRACTSOLVER) {
			ns.tprintf("Fetching %s", file);
			await ns.wget(BASEURL + "contractsolver/" + file, file);
		}
	}
}
