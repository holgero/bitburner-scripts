const FILES = [
	"actiondb.txt",
	"allowed.txt",
	"budget.txt",
	"contracts.txt",
	"corporation.txt",
	"database.txt",
	"factiongoals.txt",
	"stopselling.txt"
];

/** @param {NS} ns */
export async function main(ns) {
	for (var file of FILES) {
		ns.rm(file);
	}
}