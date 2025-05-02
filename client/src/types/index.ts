// Guild data types
export interface Guild {
  id: number;
  name: string;
  realm: string;
  faction: string;
  description: string;
  memberCount: number;
  lastUpdated: string;
  emblemUrl: string;
  serverRegion: string;
}

// Character (roster member) types
export interface Character {
  id: number;
  name: string;
  className: string;
  specName: string;
  rank: number;
  level: number;
  avatarUrl: string;
  itemLevel: number;
  guildId: number;
  blizzardId: string;
  lastUpdated: string;
}

export interface RosterResponse {
  characters: Character[];
  apiStatus: string;
  lastUpdated: string;
}

// Raid Progress types
export interface RaidProgress {
  id: number;
  name: string;
  bosses: number;
  bossesDefeated: number;
  difficulty: string;
  guildId: number;
  worldRank?: number;
  regionRank?: number;
  realmRank?: number;
  lastUpdated: string;
}

export interface RaidProgressResponse {
  progresses: RaidProgress[];
  apiStatus: string;
  lastUpdated: string;
}

// Raid Boss types
export interface RaidBoss {
  id: number;
  name: string;
  raidName: string;
  iconUrl?: string;
  bestTime?: string;
  bestParse?: string;
  pullCount?: number; // Renamed from wipeCount to pullCount
  defeated?: boolean;
  inProgress?: boolean; // New field to explicitly mark boss as in progress
  difficulty?: string;
  guildId: number;
  lastUpdated?: string;
  // New fields for WarcraftLogs integration
  warcraftLogsId?: string;
  dpsRanking?: number;
  healingRanking?: number;
  tankRanking?: number;
  lastKillDate?: string | Date;
  killCount?: number;
  fastestKill?: string;
  reportUrl?: string;
  bossId?: string;
  encounterID?: number;
  raiderIoData?: any;
  warcraftLogsData?: any;
}

export interface RaidBossesResponse {
  bosses: RaidBoss[];
  apiStatus: string;
  lastUpdated: string;
}

// Guild Ranks
export interface GuildRank {
  id: number;
  name: string;
}

export const GUILD_RANKS: GuildRank[] = [
  { id: 0, name: "Guild Master" },
  { id: 1, name: "Officer" },
  { id: 2, name: "Raider" },
  { id: 3, name: "Trial" },
  { id: 4, name: "Social" },
  { id: 5, name: "Alt" }
];

export const getRankName = (rankId: number): string => {
  const rank = GUILD_RANKS.find(r => r.id === rankId);
  return rank ? rank.name : "Unknown";
};
