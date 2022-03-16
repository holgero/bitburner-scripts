import * as c from "constants.js";

const STORY_LINE = [
	{ name: c.CYBERSEC, backdoor: "CSEC", work: c.HACKING, location: "" },
	{ name: c.NETBURNERS, backdoor: "", work: c.HACKING, location: "" },
	{ name: c.SECTOR12, backdoor: "", work: c.HACKING, location: c.SECTOR12 },
	{ name: c.NITESEC, backdoor: "avmnite-02h", work:c.HACKING, location:"" },
	{ name: c.BLACK_HAND, backdoor: "I.I.I.I", work:c.HACKING, location:"" },
	{ name: c.CHONGQING, backdoor: "", work:c.HACKING, location: c.CHONGQING },
	{ name: c.TIAN_DI_HUI, backdoor: "", work:c.HACKING, location: c.CHONGQING },
	{ name: c.BITRUNNERS, backdoor: "run4theh111z", work: c.HACKING, location: "" },
	{ name: c.DAEDALUS, backdoor: "", work: c.HACKING, location: "" }
	];

const AUGS_BEFORE_INSTALL = 7;
const AUGS_PER_FACTION = 3;

/** @param {NS} ns **/
export async function main(ns) {
	var faction_augmentations = [];
	buildDatabase(ns, faction_augmentations, STORY_LINE);
	// ns.tprintf("Database of factions and augmentations: %s", JSON.stringify(faction_augmentations));

	var factionsToJoin = [];
	for (var faction of faction_augmentations) {
		factionsToJoin.push(faction.name);
	}
	// ns.tprintf("Factions to join: %s", JSON.stringify(factionsToJoin));

	var faction_goals = [];
	var newAugs = 0;
	for (var faction of faction_augmentations) {
		var augsToAdd = Math.min(AUGS_PER_FACTION, AUGS_BEFORE_INSTALL - newAugs);
		var repToReach = faction.augmentations.length >= augsToAdd ?
			faction.augmentations[augsToAdd - 1].reputation :
			faction.augmentations[faction.augmentations.length - 1].reputation;
		for (var augmentation of faction.augmentations) {
			if (augmentation.reputation <= repToReach) {
				newAugs++;
			}
		}
		if (ns.getFactionRep(faction.name) < repToReach) {
			faction_goals.push({ ...faction, reputation: repToReach });
		}
		if (newAugs >= AUGS_BEFORE_INSTALL) {
			break;
		}
	}
	// ns.tprintf("Faction goals: %s", JSON.stringify(faction_goals));
	await ns.write("nodestart.txt", JSON.stringify({ toJoin: factionsToJoin, factionGoals: faction_goals }), "w");
}

/** @param {NS} ns **/
function buildDatabase(ns, faction_augmentations, factions) {
	var ignore = ns.getOwnedAugmentations(true);
	for (var faction of factions) {
		var augmentations = ns.getAugmentationsFromFaction(faction.name).filter(a => !ignore.includes(a));
		if (augmentations.length > 0) {
			var augmentations_with_rep = [];
			for (var augmentation of augmentations) {
				augmentations_with_rep.push({
					augmentation: augmentation,
					reputation: ns.getAugmentationRepReq(augmentation)
				});
			}
			augmentations_with_rep.sort((a, b) => a.reputation - b.reputation);
			faction_augmentations.push({ ...faction, augmentations: augmentations_with_rep });
			ignore = ignore.concat(augmentations);
		}
	}
}