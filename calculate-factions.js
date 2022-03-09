import * as c from "constants.js";
const STORY_LINE = [ c.CYBERSEC, c.NITESEC, c.BLACK_HAND, c.BITRUNNERS, c.DAEDALUS ];
const CITIES = [ c.SECTOR12, c.AEVUM, c.ISHIMA, c.CHONGQING, c.NEW_TOKYO, c.VOLHAVEN ];

/** @param {NS} ns **/
export async function main(ns) {
	for (var faction of CITIES) {
		ns.tprintf("Faction %s", faction);
	}
}