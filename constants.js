// game world
export const SECTOR12 = "Sector-12";
export const AEVUM = "Aevum";
export const VOLHAVEN = "Volhaven";
export const CHONGQING = "Chongqing";
export const NEW_TOKYO = "New Tokyo";
export const ISHIMA = "Ishima";

export const CITIES = [ SECTOR12, AEVUM, VOLHAVEN, CHONGQING, NEW_TOKYO, ISHIMA ];

// factions
// city factions have the same name as the cities

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

// criminal factions
export const SLUM_SNAKES = "Slum Snakes";
export const TETRADS = "Tetrads";
export const SPEAKERS = "Speakers for the Dead";

// late game factions
export const DAEDALUS = "Daedalus";
export const SYNDICATE = "The Syndicate";

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
	"OmniTek Incorporated",
	"Bachman & Associates",
	CLARKE,
	"Fulcrum Secret Technologies",
	SLUM_SNAKES,
	TETRADS,
	"Silhouette",
	SPEAKERS,
	"The Dark Army",
	SYNDICATE,
	"The Covenant",
	DAEDALUS,
	"Illuminati"
];

// working types
export const HACKING = "Hacking Contracts";
export const FIELD_WORK = "Field Work";
export const SECURITY_WORK = "Security Work";

// augmentations
export const GOVERNOR = "NeuroFlux Governor";
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