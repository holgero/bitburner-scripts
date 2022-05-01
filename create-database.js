import * as c from "constants.js";

const STORY_LINE = [
	{ name: c.CYBERSEC, backdoor: "CSEC", money: 0, work: c.HACKING, location: "" },
	{ name: c.NETBURNERS, backdoor: "", money: 0, work: c.HACKING, location: "" },
	{ name: c.SECTOR12, backdoor: "", money: 15000000, work: c.HACKING, location: c.SECTOR12 },
	{ name: c.TIAN_DI_HUI, backdoor: "", money: 1000000, work: c.HACKING, location: c.CHONGQING },
	{ name: c.NITESEC, backdoor: "avmnite-02h", work: c.HACKING, location: "" },
	{ name: c.SLUM_SNAKES, backdoor: "", money: 1000000, stats: 30, work: c.SECURITY_WORK, location: "" },
	{ name: c.CHONGQING, backdoor: "", money: 20000000, work: c.HACKING, location: c.CHONGQING },
	{ name: c.TETRADS, backdoor: "", money: 0, stats: 75, work: c.SECURITY_WORK, location: c.CHONGQING },
	{ name: c.VOLHAVEN, backdoor: "", money: 50000000, work: c.HACKING, location: c.VOLHAVEN },
	{ name: c.AEVUM, backdoor: "", money: 40000000, work: c.HACKING, location: c.AEVUM },
	{ name: c.NEW_TOKYO, backdoor: "", money: 20000000, work: c.HACKING, location: c.NEW_TOKYO },
	{ name: c.ISHIMA, backdoor: "", money: 30000000, work: c.HACKING, location: c.ISHIMA },
	{ name: c.BLACK_HAND, backdoor: "I.I.I.I", work: c.HACKING, location: "" },
	{ name: c.BITRUNNERS, backdoor: "run4theh111z", work: c.HACKING, location: "" },
	{ name: c.SYNDICATE, backdoor: "", money: 10000000, stats: 200, work: c.HACKING, location: c.SECTOR12 },
	{ name: c.NWO, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.ECORP, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.CLARKE, backdoor: "", company: true, money: 0, stats: 0, work: c.HACKING, location: "" },
	{ name: c.SPEAKERS, backdoor: "", money: 0, stats: 300, work: c.HACKING, location: "" },
	{ name: c.DAEDALUS, backdoor: "", money: 100000000000, work: c.HACKING, location: "" }
];

/** @param {NS} ns **/
export async function main(ns) {
	const owned_augmentations = ns.getOwnedAugmentations(true);
	const faction_augmentations = [];
	buildFactionAugmentations(ns, STORY_LINE, faction_augmentations, owned_augmentations);
	removeDuplicateAugmentations(faction_augmentations);
	const augmentations_factions = [];
	buildAugmentationsFactions(ns, faction_augmentations, augmentations_factions);
	await ns.write("database.txt", JSON.stringify(
		{
			faction_augmentations: faction_augmentations,
			augmentations_factions: augmentations_factions,
			owned_augmentations: owned_augmentations
		}), "w");
}

/** @param {NS} ns **/
function buildFactionAugmentations(ns, factions, faction_augmentations, owned_augmentations) {
	var ignore = owned_augmentations.slice(0);
	ignore.push(c.GOVERNOR);
	for (var faction of factions) {
		var augmentations = ns.getAugmentationsFromFaction(faction.name).
			filter(a => !ignore.includes(a)).
			map(a => ({
				augmentation: a,
				reputation: ns.getAugmentationRepReq(a),
				price: ns.getAugmentationPrice(a),
				requirements: ns.getAugmentationPrereq(a)
			}));
		if (augmentations.length > 0) {
			augmentations.sort((a, b) => a.reputation - b.reputation);
			faction_augmentations.push({ ...faction, augmentations: augmentations });
		}
	}
}

/** @param {NS} ns **/
function buildAugmentationsFactions(ns, factions, augmentations) {
	for (var faction of factions) {
		for (var augmentation of faction.augmentations) {
			augmentations.push({...augmentation, faction:faction.name});
		}
	}
}

function removeDuplicateAugmentations(faction_augmentations) {
	// defer obtaining an augmentation from an early faction, iff it is at the end of their 
	// list of available augmentations (so that it costs extra reputation effort to obtain)
	for (var ii = 0; ii < faction_augmentations.length - 1; ii++) {
		var element = faction_augmentations[ii];
		do {
			if (element.augmentations.length > 0) {
				var lastAugmentation = element.augmentations[element.augmentations.length - 1];
				if (hasAugmentation(lastAugmentation.augmentation, faction_augmentations.slice(ii + 1))) {
					element.augmentations.pop();
					continue;
				}
			}
			break;
		} while (true);
	}
	removeFactionsWithoutAugmentations(faction_augmentations);
	var allAugmentations = [];
	for (var faction of faction_augmentations) {
		var filtered = faction.augmentations.filter(a => !allAugmentations.includes(a.augmentation));
		faction.augmentations = filtered;
		for (var augmentation of faction.augmentations) {
			allAugmentations.push(augmentation.augmentation);
		}
	}
	removeFactionsWithoutAugmentations(faction_augmentations);
}

function hasAugmentation(augmentation, faction_augmentations) {
	for (var faction of faction_augmentations) {
		if (faction.augmentations.some(a => a.augmentation == augmentation)) {
			return true;
		}
	}
	return false;
}

function removeFactionsWithoutAugmentations(faction_augmentations) {
	for (var ii = 0; ii < faction_augmentations.length; ii++) {
		var element = faction_augmentations[ii];
		if (element.augmentations.length == 0) {
			faction_augmentations.splice(ii, 1);
			ii--;
		}
	}
}