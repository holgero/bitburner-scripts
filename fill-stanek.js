/** @param {NS} ns */
export async function main(ns) {
	const options = ns.flags([["clear", false], ["definitions", false], ["active", false]]);
	if (!ns.stanek.acceptGift()) {
		ns.tprintf("Couldn't accept staneks gift.");
		return;
	}
	if (options.definitions) {
		const frags = ns.stanek.fragmentDefinitions();
		for (const frag of frags) {
			ns.tprintf("Fragment: %s", JSON.stringify(frag));
		}
	}
	const height = ns.stanek.giftHeight();
	const width = ns.stanek.giftWidth();
	if (options.active) {
		ns.tprintf("Gift size (width x height): %d x %d", width, height);
		for (const frag of ns.stanek.activeFragments()) {
			ns.tprintf("ns.stanek.placeFragment(%d, %d, %d, %d);", frag.x, frag.y, frag.rotation, frag.id);
		}
		return;
	}
	if (options.clear) {
		ns.stanek.clearGift();
		return;
	}
	if (height == 5 && width == 6) {
		ns.stanek.placeFragment(0, 0, 0, 5);
		ns.stanek.placeFragment(2, 0, 0, 0);
		ns.stanek.placeFragment(0, 1, 3, 10);
		ns.stanek.placeFragment(0, 2, 0, 105);
		ns.stanek.placeFragment(2, 4, 0, 20);
		ns.stanek.placeFragment(3, 2, 0, 28);
		ns.stanek.placeFragment(3, 0, 0, 105);
		return;
	}
	if (height == 6 && width == 6) {
		ns.stanek.placeFragment(0, 0, 0, 5);
		ns.stanek.placeFragment(2, 0, 2, 10);
		ns.stanek.placeFragment(4, 0, 3, 12);
		ns.stanek.placeFragment(0, 1, 1, 14);
		ns.stanek.placeFragment(1, 2, 2, 20);
		ns.stanek.placeFragment(1, 3, 2, 30);
		ns.stanek.placeFragment(3, 3, 2, 16);
		ns.stanek.placeFragment(3, 4, 0, 28);
		ns.stanek.placeFragment(0, 4, 0, 25);
		return;
	}
	if (height == 6 && width == 7) {
		ns.stanek.placeFragment(0, 1, 1, 16);
		ns.stanek.placeFragment(4, 1, 1, 101);
		ns.stanek.placeFragment(6, 0, 1, 20);
		ns.stanek.placeFragment(4, 4, 0, 14);
		ns.stanek.placeFragment(2, 4, 0, 30);
		ns.stanek.placeFragment(1, 2, 2, 100);
		ns.stanek.placeFragment(2, 0, 2, 6);
		ns.stanek.placeFragment(0, 0, 2, 1);
		ns.stanek.placeFragment(3, 1, 3, 0);
		ns.stanek.placeFragment(0, 3, 1, 12);
		return;
	}
	if (height == 7 && width == 7) {
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
		// if bladeburner
		// ns.stanek.placeFragment(2, 4, 1, 30);
		// else
		ns.stanek.placeFragment(2, 4, 1, 16);
		// endif

		ns.stanek.placeFragment(2, 2, 3, 100);
		return;
	}
	if (height == 7 && width >= 8) {
		ns.stanek.placeFragment(0, 0, 0, 1);
		ns.stanek.placeFragment(2, 0, 0, 5);
		ns.stanek.placeFragment(4, 0, 0, 0);
		ns.stanek.placeFragment(6, 0, 1, 10);
		ns.stanek.placeFragment(0, 1, 1, 18);
		ns.stanek.placeFragment(0, 3, 1, 16);
		ns.stanek.placeFragment(0, 5, 0, 25);
		ns.stanek.placeFragment(7, 3, 1, 20);
		ns.stanek.placeFragment(3, 6, 2, 6);
		ns.stanek.placeFragment(4, 2, 2, 12);
		ns.stanek.placeFragment(4, 3, 0, 30);
		ns.stanek.placeFragment(4, 4, 0, 14);
		ns.stanek.placeFragment(2, 2, 1, 7);
		ns.stanek.placeFragment(2, 3, 3, 27);
	}
}