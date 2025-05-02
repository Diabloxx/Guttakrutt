import { apiRequest } from "@/lib/queryClient";
import type { 
  Guild,
  RosterResponse,
  RaidProgressResponse,
  RaidBossesResponse
} from "@/types";

// Default guild parameters
const DEFAULT_GUILD_NAME = "Guttakrutt";
const DEFAULT_REALM = "Tarren Mill";
const DEFAULT_REGION = "eu";

export async function fetchGuildInfo(
  guildName: string = DEFAULT_GUILD_NAME,
  realm: string = DEFAULT_REALM,
  region: string = DEFAULT_REGION
): Promise<Guild> {
  const params = new URLSearchParams({
    name: guildName,
    realm,
    region
  });
  
  const res = await apiRequest("GET", `/api/guild?${params.toString()}`);
  return res.json();
}

export async function fetchGuildRoster(
  guildName: string = DEFAULT_GUILD_NAME,
  realm: string = DEFAULT_REALM,
  region: string = DEFAULT_REGION
): Promise<RosterResponse> {
  const params = new URLSearchParams({
    name: guildName,
    realm,
    region
  });
  
  const res = await apiRequest("GET", `/api/roster?${params.toString()}`);
  return res.json();
}

export async function fetchRaidProgress(
  guildName: string = DEFAULT_GUILD_NAME,
  realm: string = DEFAULT_REALM,
  region: string = DEFAULT_REGION
): Promise<RaidProgressResponse> {
  const params = new URLSearchParams({
    name: guildName,
    realm,
    region
  });
  
  const res = await apiRequest("GET", `/api/raid-progress?${params.toString()}`);
  return res.json();
}

export async function fetchRaidBosses(
  guildName: string = DEFAULT_GUILD_NAME,
  realm: string = DEFAULT_REALM,
  raidName: string,
  difficulty: string = "mythic",
  region: string = DEFAULT_REGION
): Promise<RaidBossesResponse> {
  const params = new URLSearchParams({
    raid: raidName,
    name: guildName,
    realm,
    region,
    difficulty
  });
  
  const res = await apiRequest("GET", `/api/raid-bosses?${params.toString()}`);
  return res.json();
}
