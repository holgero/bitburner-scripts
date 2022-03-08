import { formatMoney } from "helpers.js";

const ALL_FACTIONS = [
	"CyberSec",
	"Tian Di Hui",
	"Netburners",
	"Sector-12",
	"Chongqing",
	"New Tokyo",
	"Ishima",
	"Aevum",
	"Volhaven",
	"NiteSec",
	"The Black Hand",
	"BitRunners",
	"ECorp",
	"MegaCorp",
	"KuaiGong International",
	"Four Sigma",
	"NWO",
	"Blade Industries",
	"OmniTek Incorporated",
	"Bachman & Associates",
	"Clarke Incorporated",
	"Fulcrum Secret Technologies",
	"Slum Snakes",
	"Tetrads",
	"Silhouette",
	"Speakers for the Dead",
	"The Dark Army",
	"The Syndicate",
	"The Covenant",
	"Daedalus",
	"Illuminati"
];

/** @param {NS} ns **/
export async function main(ns) {
	var factions;
	var options = ns.flags([["owned", false],
		["member", false],
		["filter_reputation", false],
		["filter_price", false]]);
	if (options._.length > 0) {
		factions = options._;
	} else {
		if (options.member) {
			factions = ns.getPlayer().factions;
		} else {
			factions = ALL_FACTIONS;
		}
	}
	var skip;
	if (!options.owned) {
		skip = ns.getOwnedAugmentations(true);
	} else {
		skip = ["NeuroFlux Governor"];
	}
	var augmentations = [];
	for (var faction of factions) {
		var faction_augmentations = ns.getAugmentationsFromFaction(faction);
		for (var augmentation of faction_augmentations) {
			if (!skip.includes(augmentation)) {
				if (options.filter_reputation) {
					if (ns.getFactionRep(faction) < ns.getAugmentationRepReq(augmentation)) {
						continue;
					}
				}
				if (options.filter_price) {
					if (ns.getServerMoneyAvailable("home") < ns.getAugmentationPrice(augmentation)) {
						continue;
					}
				}
				// skip.push(augmentation);
				augmentations.push({
					name: augmentation,
					price: ns.getAugmentationPrice(augmentation),
					reputation: ns.getAugmentationRepReq(augmentation),
					have: ns.getOwnedAugmentations().includes(augmentation) ? "*" : " ",
					faction: faction
				});
			}
		}
	}
	ns.tprintf("Sorted by price");
	augmentations.sort(function (a, b) { return a.price - b.price });
	for (var augmentation of augmentations) {
		printAugmentation(ns, augmentation);
	}

	ns.tprintf("\nSorted by Reputation");
	augmentations.sort(function (a, b) { return a.reputation - b.reputation });
	for (var augmentation of augmentations) {
		printAugmentation(ns, augmentation);
	}
}

function printAugmentation(ns, augmentation) {
	ns.tprintf("%50s costs %10s needs %10d %s %s",
		augmentation.name.substring(0, 49), formatMoney(augmentation.price), augmentation.reputation,
		augmentation.faction, augmentation.have);
}