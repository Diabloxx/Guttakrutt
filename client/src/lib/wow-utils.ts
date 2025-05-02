/**
 * WoW utility functions for working with classes, specs, and colors
 */

// WoW class colors (RGB and hex values)
export const CLASS_COLORS = {
  'death-knight': { rgb: '196, 30, 59', hex: '#C41E3B' },
  'demon-hunter': { rgb: '163, 48, 201', hex: '#A330C9' },
  'druid': { rgb: '255, 125, 10', hex: '#FF7D0A' },
  'evoker': { rgb: '51, 147, 127', hex: '#33937F' },
  'hunter': { rgb: '171, 212, 115', hex: '#ABD473' },
  'mage': { rgb: '105, 204, 240', hex: '#69CCF0' },
  'monk': { rgb: '0, 255, 150', hex: '#00FF96' },
  'paladin': { rgb: '245, 140, 186', hex: '#F58CBA' },
  'priest': { rgb: '255, 255, 255', hex: '#FFFFFF' },
  'rogue': { rgb: '255, 245, 105', hex: '#FFF569' },
  'shaman': { rgb: '0, 112, 222', hex: '#0070DE' },
  'warlock': { rgb: '148, 130, 201', hex: '#9482C9' },
  'warrior': { rgb: '199, 156, 110', hex: '#C79C6E' },
  // Additional entries for specific specs with custom colors
  'priest-shadow': { rgb: '188, 185, 209', hex: '#BCB9D1' },
  'priest-discipline': { rgb: '255, 255, 255', hex: '#FFFFFF' },
  'priest-holy': { rgb: '255, 255, 255', hex: '#FFFFFF' },
  'warrior-protection': { rgb: '199, 156, 110', hex: '#C79C6E' },
} as const;

// Specialization to role mapping
export const SPEC_ROLES: Record<string, 'tank' | 'healer' | 'dps'> = {
  // Death Knight
  'Blood': 'tank',
  'Unholy': 'dps',
  
  // Demon Hunter
  'Havoc': 'dps',
  'Vengeance': 'tank',
  
  // Druid
  'Balance': 'dps',
  'Feral': 'dps',
  'Guardian': 'tank',
  
  // Evoker
  'Devastation': 'dps',
  'Preservation': 'healer',
  'Augmentation': 'dps',
  
  // Hunter
  'Beast Mastery': 'dps',
  'Marksmanship': 'dps',
  'Survival': 'dps',
  
  // Mage
  'Arcane': 'dps',
  'Fire': 'dps',
  'Frost (Mage)': 'dps',
  
  // Monk
  'Brewmaster': 'tank',
  'Mistweaver': 'healer',
  'Windwalker': 'dps',
  
  // Paladin
  'Holy (Paladin)': 'healer',
  'Protection (Paladin)': 'tank',
  'Retribution': 'dps',
  
  // Priest
  'Discipline': 'healer',
  'Holy (Priest)': 'healer',
  'Shadow': 'dps',
  
  // Rogue
  'Assassination': 'dps',
  'Outlaw': 'dps',
  'Subtlety': 'dps',
  
  // Shaman
  'Elemental': 'dps',
  'Enhancement': 'dps',
  'Restoration (Shaman)': 'healer',
  
  // Warlock
  'Affliction': 'dps',
  'Demonology': 'dps',
  'Destruction': 'dps',
  
  // Warrior
  'Arms': 'dps',
  'Fury': 'dps',
  'Protection (Warrior)': 'tank',
  
  // Death Knight (again for Frost)
  'Frost (DK)': 'dps',
  
  // Druid (again for Restoration)
  'Restoration (Druid)': 'healer',
};

// Role icons for each role
export const ROLE_ICONS = {
  'tank': '/assets/icons/role-tank.svg',
  'healer': '/assets/icons/role-healer.svg',
  'dps': '/assets/icons/role-dps.svg',
} as const;

/**
 * Get the CSS class for a WoW class color
 */
export function getClassColorClass(className: string): string {
  const normalizedClass = className.toLowerCase().replace(' ', '-');
  
  // Default styling if no match
  if (!normalizedClass) {
    return 'text-wow-light';
  }
  
  // Check for death knight
  if (normalizedClass === 'death-knight' || normalizedClass === 'dk') {
    return 'text-[#C41E3B]';
  }
  
  // Check for demon hunter
  if (normalizedClass === 'demon-hunter' || normalizedClass === 'dh') {
    return 'text-[#A330C9]';
  }
  
  // Handle all other classes
  const classMapping: Record<string, string> = {
    'druid': 'text-[#FF7D0A]',
    'evoker': 'text-[#33937F]',
    'hunter': 'text-[#ABD473]',
    'mage': 'text-[#69CCF0]',
    'monk': 'text-[#00FF96]',
    'paladin': 'text-[#F58CBA]',
    'priest': 'text-white',
    'rogue': 'text-[#FFF569]',
    'shaman': 'text-[#0070DE]',
    'warlock': 'text-[#9482C9]',
    'warrior': 'text-[#C79C6E]',
  };
  
  return classMapping[normalizedClass] || 'text-wow-light';
}

/**
 * Get the RGB color values for a WoW class
 */
export function getClassColor(className: string) {
  const normalizedClass = className.toLowerCase().replace(' ', '-');
  
  // Default color if no match
  if (!normalizedClass) {
    return { rgb: '255, 255, 255', hex: '#FFFFFF' };
  }
  
  // Handle special case for DK and DH abbreviations
  if (normalizedClass === 'dk') {
    return CLASS_COLORS['death-knight'];
  }
  
  if (normalizedClass === 'dh') {
    return CLASS_COLORS['demon-hunter'];
  }
  
  // Return the class color or default to white
  return CLASS_COLORS[normalizedClass as keyof typeof CLASS_COLORS] || 
    { rgb: '255, 255, 255', hex: '#FFFFFF' };
}

/**
 * Get role (tank, healer, dps) for a spec
 */
export function getSpecRole(spec: string): 'tank' | 'healer' | 'dps' {
  return SPEC_ROLES[spec] || 'dps';
}

/**
 * Get icon path for a role
 */
export function getRoleIcon(role: 'tank' | 'healer' | 'dps'): string {
  return ROLE_ICONS[role];
}

/**
 * Convert class name to slug for use in URLs or file paths
 */
export function getClassSlug(className: string): string {
  const normalizedClass = className.toLowerCase().trim();
  
  // Handle special abbreviations
  if (normalizedClass === 'dk') return 'death-knight';
  if (normalizedClass === 'dh') return 'demon-hunter';
  
  // Handle spaces
  return normalizedClass.replace(/\s+/g, '-');
}

/**
 * Format a number to show k/m for thousands/millions
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'm';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
}

/**
 * Get formatted time from seconds
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format a date in a localized way
 */
export function formatDate(dateString: string, locale: string = 'en'): string {
  const date = new Date(dateString);
  
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

/**
 * Convert item level to colored text class
 */
export function getItemLevelColor(ilvl: number): string {
  if (ilvl >= 490) return 'text-[#ff8000]'; // Legendary/Mythic
  if (ilvl >= 470) return 'text-[#a335ee]'; // Epic
  if (ilvl >= 450) return 'text-[#0070dd]'; // Rare
  if (ilvl >= 430) return 'text-[#1eff00]'; // Uncommon
  return 'text-white'; // Common
}

/**
 * Get class icon URL
 */
export function getClassIconUrl(className: string): string {
  const slug = getClassSlug(className);
  return `/assets/icons/class-${slug}.png`;
}