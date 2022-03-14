import { gridPaths } from "contractsolver/gridpaths.js";
import { gridPaths2 } from "contractsolver/gridpaths2.js";
import { largestPrimeFactor } from "contractsolver/largestprimefactor.js";
import { mergeOverlappingIntervals } from "contractsolver/mergeoverlappingintervals.js";
import { spiralizeMatrix } from "contractsolver/spiralizematrix.js";
import { arrayJumpingGame } from "contractsolver/arrayjumpinggame.js";
import { minimalPathSum } from "contractsolver/minimalpathsum.js";
import { subarraySum } from "contractsolver/subarraysum.js";
import { totalWaysToSum } from "contractsolver/totalwaystosum.js";
import { generateIpAddress } from "contractsolver/generateipaddress.js";
import { validExpressions } from "contractsolver/validexpressions.js";
import { stockTraderI, stockTraderII, stockTraderIII, stockTraderIV } from "contractsolver/stocktrader.js";

var known;
const PATHS1 = "Unique Paths in a Grid I";
const PATHS2 = "Unique Paths in a Grid II";
const PRIME = "Find Largest Prime Factor";
const MERGE = "Merge Overlapping Intervals";
const SPIRAL = "Spiralize Matrix";
const GAME = "Array Jumping Game";
const TRIANGLE = "Minimum Path Sum in a Triangle";
const TRADER1 = "Algorithmic Stock Trader I";
const TRADER2 = "Algorithmic Stock Trader II";
const TRADER3 = "Algorithmic Stock Trader III";
const TRADER4 = "Algorithmic Stock Trader IV";
const SUBARRAY = "Subarray with Maximum Sum";
const WAYSUM = "Total Ways to Sum";
const IPADDR = "Generate IP Addresses";
const VALID = "Find All Valid Math Expressions";

/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args.length == 0) {
		usage(ns);
		return;
	}
	ns.disableLog("scan");
	known = ns.getPurchasedServers();
	known.push("home");
	if (ns.args[0] == "auto") {
		await traverse(ns, "home", findAndSolveContracts);
		return;
	}
	if (ns.args[0] == "list") {
		await traverse(ns, "home", findContracts);
		return;
	}
}

/** @param {NS} ns **/
function usage(ns) {
	ns.tprint("usage: run solve_contract.js [auto|list|solve] <server> <filename> <solution>...");
}

/** @param {NS} ns **/
async function traverse(ns, startServer, serverProc) {
	var servers = ns.scan(startServer);
	for (var i = 0; i < servers.length; i++) {
		var server = servers[i];
		if (known.includes(servers[i])) {
			continue;
		}
		known.push(servers[i]);
		await serverProc(ns, server);
		await traverse(ns, server, serverProc);
	}
}

/** @param {NS} ns **/
async function findAndSolveContracts(ns, server) {
	var contracts = ns.ls(server, ".cct");
	if (contracts.length > 0) {
		for (var contract of contracts) {
			var type = ns.codingcontract.getContractType(contract, server);
			var data = ns.codingcontract.getData(contract, server);
			var solution;
			switch (type) {
				case PATHS1:
					solution = gridPaths(data[0], data[1]);
					break;
				case PATHS2:
					solution = gridPaths2(data.length, data[0].length, data);
					break;
				case PRIME:
					solution = +largestPrimeFactor(data);
					break;
				case MERGE:
					solution = mergeOverlappingIntervals(data);
					break;
				case SPIRAL:
					solution = spiralizeMatrix(data);
					break;
				case GAME:
					solution = +arrayJumpingGame(data);
					break;
				case TRIANGLE:
					solution = +minimalPathSum(data, 0, 0);
					break;
				case SUBARRAY:
					solution = +subarraySum(data);
					break;
				case WAYSUM:
					solution = +totalWaysToSum(data);
					break;
				case IPADDR:
					solution = generateIpAddress(data);
					break;
				case VALID:
					solution = validExpressions(data[0], data[1]);
					break;
				case TRADER1:
					solution = +stockTraderI(data);
					break;
				case TRADER2:
					solution = +stockTraderII(data);
					break;
				case TRADER3:
					solution = +stockTraderIII(data);
					break;
				case TRADER4:
					solution = +stockTraderIV(ns, data[0], data[1]);
					if (solution < 0) {
						ns.tprintf("Did not find a solution.");
						return;
					}
					break;
				default:
					continue;
			}

			ns.tprintf("Solving: %s, on %s %s with data %s. Solution: %s", type, server, contract, data, JSON.stringify(solution));
			ns.spawn("solve_contract2.js", 1, server, contract, JSON.stringify(solution));
		}
	}
}

/** @param {NS} ns **/
async function findContracts(ns, server) {
	var contracts = ns.ls(server, ".cct");
	if (contracts.length > 0) {
		for (var contract of contracts) {
			ns.tprint(server + " " + contract);
			ns.tprint(ns.codingcontract.getContractType(contract, server));
			ns.tprint(ns.codingcontract.getData(contract, server));
		}
	}
}