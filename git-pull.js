const FILES = ["calculate-goals.js",
	"commit-crimes.js",
	"constants.js",
	"corporation.js",
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
	"writeprogram.js",
	"contractsolver/arrayjumpinggame.js",
	"contractsolver/generateipaddress.js",
	"contractsolver/gridpaths2.js",
	"contractsolver/gridpaths.js",
	"contractsolver/largestprimefactor.js",
	"contractsolver/mergeoverlappingintervals.js",
	"contractsolver/minimalpathsum.js",
	"contractsolver/sanitizeparenthesis.js",
	"contractsolver/spiralizematrix.js",
	"contractsolver/stocktrader.js",
	"contractsolver/subarraysum.js",
	"contractsolver/totalwaystosum.js",
	"contractsolver/validexpressions.js"];
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
}
