import { gridPaths, gridPaths2, shortestPath } from "contractsolver/gridpaths.js";
import { largestPrimeFactor } from "contractsolver/largestprimefactor.js";
import { mergeOverlappingIntervals } from "contractsolver/mergeoverlappingintervals.js";
import { spiralizeMatrix } from "contractsolver/spiralizematrix.js";
import { arrayJumpingGame, arrayJumpingGame2 } from "contractsolver/arrayjumpinggame.js";
import { minimalPathSum } from "contractsolver/minimalpathsum.js";
import { subarraySum } from "contractsolver/subarraysum.js";
import { totalWaysToSum, totalWaysToSum2 } from "contractsolver/totalwaystosum.js";
import { generateIpAddress } from "contractsolver/generateipaddress.js";
import { validExpressions } from "contractsolver/validexpressions.js";
import { sanitizeParenthesis } from "contractsolver/sanitizeparenthesis.js";
import { stockTraderI, stockTraderII, stockTraderIII, stockTraderIV } from "contractsolver/stocktrader.js";
import { hammingDecode, hammingEncode } from "contractsolver/hammingcode.js";
import { rleCompression } from "contractsolver/compression.js";
import { graphColoring } from "contractsolver/graphcoloring.js";

const PATHS1 = "Unique Paths in a Grid I";
const PATHS2 = "Unique Paths in a Grid II";
const SHORTEST_PATH = "Shortest Path in a Grid";
const PRIME = "Find Largest Prime Factor";
const MERGE = "Merge Overlapping Intervals";
const SPIRAL = "Spiralize Matrix";
const GAME = "Array Jumping Game";
const GAME2 = "Array Jumping Game II";
const TRIANGLE = "Minimum Path Sum in a Triangle";
const TRADER1 = "Algorithmic Stock Trader I";
const TRADER2 = "Algorithmic Stock Trader II";
const TRADER3 = "Algorithmic Stock Trader III";
const TRADER4 = "Algorithmic Stock Trader IV";
const SUBARRAY = "Subarray with Maximum Sum";
const WAYSUM = "Total Ways to Sum";
const WAYSUM2 = "Total Ways to Sum II";
const IPADDR = "Generate IP Addresses";
const VALID = "Find All Valid Math Expressions";
const SANITIZE = "Sanitize Parentheses in Expression";
const HAMMING_DECODE = "HammingCodes: Encoded Binary to Integer";
const HAMMING_ENCODE = "HammingCodes: Integer to Encoded Binary";
const RLE_COMPRESSION = "Compression I: RLE Compression";
const GRAPH_COLOR = "Proper 2-Coloring of a Graph";

/** @param {NS} ns **/
export async function main(ns) {
	const contracts = JSON.parse(ns.read("contracts.txt"));
	for (var contract of contracts) {
		await solveContract(ns, contract);
	}
}

/** @param {NS} ns **/
export async function solveContract(ns, contract) {
	const server = contract.server;
	const type = contract.type;
	const file = contract.file;
	const data = contract.data;
	var solution;

	switch (type) {
		case PATHS1:
			solution = gridPaths(data[0], data[1]);
			break;
		case PATHS2:
			solution = gridPaths2(data.length, data[0].length, data);
			break;
		case SHORTEST_PATH:
			solution = shortestPath(data.length, data[0].length, data);
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
		case GAME2:
			solution = +arrayJumpingGame2(data);
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
		case WAYSUM2:
			solution = +totalWaysToSum2(data[0], data[1]);
			break;
		case IPADDR:
			solution = generateIpAddress(data);
			break;
		case VALID:
			solution = validExpressions(data[0], data[1]);
			break;
		case SANITIZE:
			solution = sanitizeParenthesis(data);
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
		case HAMMING_DECODE:
			solution = +hammingDecode(data);
			break;
		case HAMMING_ENCODE:
			solution = hammingEncode(data);
			break;
		case RLE_COMPRESSION:
			solution = rleCompression(data);
			break;
		case GRAPH_COLOR:
			solution = graphColoring(data[0], data[1]);
			break;
		default:
			ns.tprintf("Cannot solve contract: %s %s '%s' '%s'",
				server, file, type, JSON.stringify(data));
			return;
	}

	await ns.sleep(500);
	ns.tprintf("Solving: %s, on %s %s with data %s. Solution: %s",
	  type, server, file, JSON.stringify(data), JSON.stringify(solution));
	// ns.tprintf("Solving: %s, on %s %s with data %s.", type, server, file, JSON.stringify(data));
	var result = ns.codingcontract.attempt(solution, file, server, { returnReward: true });
	if (result == "") {
		ns.tprint("Contract FAILED");
	} else {
		ns.tprintf("Success, reward: %s", result);
	}
}