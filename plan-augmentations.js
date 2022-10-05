import {
	runAndWait,
	findBestAugmentations
} from "helpers.js";

/** @param {NS} ns **/
export async function main(ns) {
	var options = ns.flags([["run_purchase", false]]);
	if (options.run_purchase && ns.stock.hasTIXAPIAccess()) {
		await runAndWait(ns, "sell-all-stocks.js");
	}
	const toPurchase = await findBestAugmentations(ns);
	const augNames = toPurchase.map(a => a.name);

	ns.tprintf("Augmentations to purchase: %s", JSON.stringify(augNames));
	if (options.run_purchase) {
		ns.spawn("purchase-augmentations.js", 1, JSON.stringify(augNames),
			"--reboot", JSON.stringify(options));
	}
}