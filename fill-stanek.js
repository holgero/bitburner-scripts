/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["clear", false]]);
	if (!ns.stanek.acceptGift()) {
		ns.tprintf("Couldn't accept staneks gift.");
		return;
	}
	const height = ns.stanek.giftHeight();
	const width = ns.stanek.giftWidth();
	if (height == 7 && width == 7) {
		/*
aaabbbb
caddeee
ccfddge
hcfffgg
hxiijjg
hiikjll
hkkkjll
		*/
		const frags = ns.stanek.fragmentDefinitions();
		for (const frag of frags) {
			//ns.tprintf("Fragment: %s", JSON.stringify(frag));
		}
		if (options.clear) {
			ns.stanek.clearGift();
		}
		ns.stanek.placeFragment(0, 0, 0, 5);
		ns.stanek.placeFragment(3, 0, 0, 6);
		ns.stanek.placeFragment(2, 1, 0, 1);
		ns.stanek.placeFragment(0, 1, 1, 0);
		ns.stanek.placeFragment(4, 1, 2, 7);
		ns.stanek.placeFragment(5, 2, 1, 18);
		ns.stanek.placeFragment(0, 3, 1, 20);
		ns.stanek.placeFragment(5, 5, 0, 21);
		ns.stanek.placeFragment(4, 4, 1, 27);
		ns.stanek.placeFragment(1, 4, 1, 28);
		// ns.stanek.placeFragment(2, 4, 1, 30);
		ns.stanek.placeFragment(2, 4, 1, 16);

		ns.stanek.placeFragment(2, 2, 3, 100);
	}
}