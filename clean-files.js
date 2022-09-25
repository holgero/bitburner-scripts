const FILES = [
	"actiondb.txt",
	"budget.txt",
	"contracts.txt",
	"corporation.txt",
	"database.txt",
	"factiongoals.txt",
	"reserved-money.txt",
	"stopselling.txt"
];
/** @param {NS} ns */
export async function main(ns) {
	for (var file of FILES) {
		ns.rm(file);
	}
	await ns.write("reserved-money.txt", JSON.stringify(0), "w");
}