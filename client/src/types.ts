import type { Character as BaseCharacter, Guild as BaseGuild, RaidProgress as BaseRaidProgress } from "@shared/schema";

// Extend the base Character type with additional properties
export interface Character extends BaseCharacter {
  // Explicitly define fields that might not be in the base type
  realm?: string;
  role?: string;
  raiderIoScore?: number;
  armoryLink?: string;
}

// Re-export Guild and RaidProgress types for compatibility
export type Guild = BaseGuild;
export type RaidProgress = BaseRaidProgress;

// Guild rank name mapping
export function getRankName(rank: number): string {
  switch(rank) {
    case 0: return 'Guild Master';
    case 1: return 'Raid Leader';
    case 2: return 'Officer';
    case 3: return 'Officer Alt';
    case 4: return 'Main Raider';
    case 5: return 'Raider';
    case 6: return 'Raid Leader Team 2';
    case 7: return 'Trial Raider';
    case 8: return 'Raid Team 2';
    case 9: return 'Member';
    default: return 'Member';
  }
}

// Utility function to get the appropriate color for a role
export function getRoleColor(role: string | null | undefined): string {
  if (!role) return '';
  
  const roleLower = role.toLowerCase();
  if (roleLower === 'tank') return 'text-slate-300';
  if (roleLower === 'dps') return 'text-red-400';
  if (roleLower === 'healing') return 'text-green-400';
  return '';
}