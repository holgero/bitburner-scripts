/** @param {NS} ns */
export async function main(ns) {
	while (true) {
		for (var fragment of ns.stanek.activeFragments()) {
			// ns.tprintf("%s", JSON.stringify(fragment));
			if (fragment.type != 18) {
				await ns.stanek.chargeFragment(fragment.x, fragment.y);
				// ns.tprintf("%s", JSON.stringify(fragment));
			}
		}
	}
}