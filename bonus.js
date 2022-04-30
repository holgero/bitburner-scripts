/** @param {NS} ns */
export async function main(ns) {
	while (true) {
		await ns.sleep(1000);
		var cooldown = ns.corporation.getCorporation().shareSaleCooldown / 5;
		var bonus = ns.corporation.getBonusTime() / 1000;
		var realtime;
		if (cooldown > 10 * bonus / 9) {
			realtime = cooldown - bonus;
		} else {
			realtime = cooldown / 10;
		}
		ns.tprintf("Cool down: %5d. Bonus time: %5d. RT cool down: %5d",
			cooldown, bonus, realtime);
	}
}