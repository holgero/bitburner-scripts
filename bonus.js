/** @param {NS} ns */
export async function main(ns) {
	while (true) {
		await ns.sleep(1000);
		ns.tprintf("Cool down: %5d. Bonus time: %5d. RT cool down: %5d",
			ns.corporation.getCorporation().shareSaleCooldown/5,
			ns.corporation.getBonusTime()/1000,
			ns.corporation.getCorporation().shareSaleCooldown/5-
			ns.corporation.getBonusTime()/1000);
	}
}