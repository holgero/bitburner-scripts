const FILES = [
	"actiondb.txt",
	"budget.txt",
	"check-end.txt",
	"contracts.txt",
	"corporation.txt",
	"database.txt",
	"estimate.txt",
	"factiongoals.txt",
	"victims.txt"
];

/** @param {NS} ns */
export async function main(ns) {
	for (var file of FILES) {
		ns.rm(file);
	}
}