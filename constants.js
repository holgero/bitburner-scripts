// game world
export const SECTOR12 = "Sector-12";
export const AEVUM = "Aevum";
export const VOLHAVEN = "Volhaven";
export const CHONGQING = "Chongqing";
export const NEW_TOKYO = "New Tokyo";
export const ISHIMA = "Ishima";

export const CITIES = [SECTOR12, AEVUM, VOLHAVEN, CHONGQING, NEW_TOKYO, ISHIMA];

// factions
// early factions
export const TIAN_DI_HUI = "Tian Di Hui";
export const NETBURNERS = "Netburners";

// hacking factions
export const NITESEC = "NiteSec";
export const CYBERSEC = "CyberSec";
export const BLACK_HAND = "The Black Hand";
export const BITRUNNERS = "BitRunners";

// corporation factions
export const ECORP = "ECorp";
export const MEGACORP = "MegaCorp";
export const KUAIGONG = "KuaiGong International";
export const FOUR_SIGMA = "Four Sigma";
export const NWO = "NWO";
export const CLARKE = "Clarke Incorporated";
export const FULCRUM = "Fulcrum Secret Technologies";
export const FULCRUM_C = "Fulcrum Technologies";
export const OMNITEK =   "OmniTek Incorporated";

// criminal factions
export const SLUM_SNAKES = "Slum Snakes";
export const TETRADS = "Tetrads";
export const SPEAKERS = "Speakers for the Dead";

// late game factions
export const DAEDALUS = "Daedalus";
export const SYNDICATE = "The Syndicate";
export const COVENANT = "The Covenant";

// special factions
export const BLADEBURNERS = "Bladeburners";
export const CHURCH = "Church of the Machine God";
export const ANARCHY = "Shadows of Anarchy";

export const ALL_FACTIONS = [
	...CITIES,
	TIAN_DI_HUI,
	NETBURNERS,
	NITESEC,
	CYBERSEC,
	BLACK_HAND,
	BITRUNNERS,
	ECORP,
	MEGACORP,
	KUAIGONG,
	FOUR_SIGMA,
	NWO,
	"Blade Industries",
	OMNITEK,
	"Bachman & Associates",
	CLARKE,
	FULCRUM,
	SLUM_SNAKES,
	TETRADS,
	"Silhouette",
	SPEAKERS,
	"The Dark Army",
	SYNDICATE,
	COVENANT,
	DAEDALUS,
	"Illuminati",
	BLADEBURNERS,
	CHURCH,
	ANARCHY,
];

// working types
export const HACKING = "HACKING";
export const FIELD_WORK = "FIELD";
export const SECURITY_WORK = "SECURITY";
export const BLADEACTIONS = "Bladeburner Actions";

// augmentations
export const GOVERNOR = "NeuroFlux Governor";
export const BLADE_SIMUL = "The Blade's Simulacrum";
export const RED_PILL = "The Red Pill";

// servers
export const WORLD_DAEMON = "w0r1d_d43m0n";

// programs
export const programs = [
	{ name: "BruteSSH.exe", level: 50, cost: 500000 },
	{ name: "FTPCrack.exe", level: 100, cost: 1500000 },
	{ name: "relaySMTP.exe", level: 250, cost: 5000000 },
	{ name: "HTTPWorm.exe", level: 500, cost: 30000000 },
	{ name: "SQLInject.exe", level: 750, cost: 250000000 }
];

export const FEATURES = {
	gangs: { sourceFile: 2 },
	corporation: { sourceFile: 3 },
	bladeburners: { sourceFile: 6 },
	hacknet: { sourceFile: 9 },
	hacknetServer: { sourceFile: 9, level: 3 },
	sleeves: { sourceFile: 10 },
	graft: { sourceFile: 10 },
	church: { sourceFile: 13 },
}

export const AUGMENTATION_TYPES = [
	"Bladeburner",
	"Combat",
	"Company",
	"Hacking",
	"Hacknet",
	"Reputation",
	"Special"
];

export const AUGMENTATION_NORMAL_PRIO = [
	"Hacking", "Special", "Reputation", "Hacknet", "Crime", "Company", "Combat", "Bladeburner",
];

export const AUGMENTATION_BLADEBURNER_PRIO = [
	"Bladeburner", "Special", "Combat", "Crime", "Hacking", "Hacknet", "Reputation", "Company",
];

export const BLADEBURNER_NODES = [
	6, 7, 11, 13
];

// interval between runs of field analysis in all cities
export const BLADEBURNER_CENSUS_INTERVALL = 1000 * 3600 * 4;

// story line
export const STORY_LINE = [
	{ name: CYBERSEC, backdoor: "CSEC", money: 0, work: HACKING, location: "" },
	{ name: NETBURNERS, backdoor: "", money: 0, hack: 80, work: HACKING, location: "" },
	{ name: SECTOR12, backdoor: "", money: 15000000, work: HACKING, location: SECTOR12 },
	{ name: TIAN_DI_HUI, backdoor: "", money: 1000000, hack: 50, work: HACKING, location: CHONGQING },
	{ name: NITESEC, backdoor: "avmnite-02h", work: HACKING, location: "" },
	{ name: SLUM_SNAKES, backdoor: "", money: 1000000, stats: 30, work: SECURITY_WORK, location: "" },
	{ name: CHONGQING, backdoor: "", money: 20000000, work: HACKING, location: CHONGQING },
	{ name: TETRADS, backdoor: "", money: 0, stats: 75, work: SECURITY_WORK, location: CHONGQING },
	{ name: VOLHAVEN, backdoor: "", money: 50000000, work: HACKING, location: VOLHAVEN },
	{ name: AEVUM, backdoor: "", money: 40000000, work: HACKING, location: AEVUM },
	{ name: NEW_TOKYO, backdoor: "", money: 20000000, work: HACKING, location: NEW_TOKYO },
	{ name: ISHIMA, backdoor: "", money: 30000000, work: HACKING, location: ISHIMA },
	{ name: BLACK_HAND, backdoor: "I.I.I.I", work: HACKING, location: "" },
	{ name: BITRUNNERS, backdoor: "run4theh111z", work: HACKING, location: "" },
	{ name: SYNDICATE, backdoor: "", money: 10000000, hack: 200, stats: 200, work: HACKING, location: SECTOR12 },
	{ name: NWO, backdoor: "", company: NWO, money: 0, hack: 250, stats: 0, work: HACKING, location: "" },
	{ name: ECORP, backdoor: "", company: ECORP, money: 0, hack: 250, stats: 0, work: HACKING, location: "" },
	{ name: CLARKE, backdoor: "", company: CLARKE, money: 0, hack: 225, stats: 0, work: HACKING, location: "" },
	{ name: SPEAKERS, backdoor: "", money: 0, hack: 100, stats: 300, work: HACKING, kills: 30, location: "" },
	{ name: BLADEBURNERS, backdoor: "", money: 0, work: BLADEACTIONS, stats: 100, location: "", special: true },
	{ name: COVENANT, backdoor: "", money: 1e12, hack: 850, stats: 850, augsNeeded: 20, work: HACKING, location: "" },
	{ name: DAEDALUS, backdoor: "", money: 100000000000, hack: 2500, augsNeeded: 30, work: HACKING, location: "" },
	{ name: CHURCH, backdoor: "", money: 0, stats: 0, location: CHONGQING, special: true },
	// late game companies, only apply for a job when hacking level is already high
	{ name: FULCRUM, backdoor: "", company: FULCRUM_C, money: 0, hack: 2000, stats: 0, work: HACKING, location: "" },
	{ name: OMNITEK, backdoor: "", company: OMNITEK, money: 0, hack: 2000, stats: 0, work: HACKING, location: "" },
];