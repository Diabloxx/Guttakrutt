import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shield, HeartPulse, Swords } from 'lucide-react';

interface WowAvatarProps {
  name: string;
  className?: string;
  realm?: string;
  spec?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showRoleIcon?: boolean;
}

/**
 * Enhanced WoW-styled Avatar component for characters
 * Shows character avatars with proper WoW class colors and role icons
 */
export function WowAvatar({
  name,
  className = 'warrior',
  realm,
  spec,
  size = 'md',
  showRoleIcon = true,
}: WowAvatarProps) {
  // Determine role type based on spec
  const role = getRoleFromSpec(spec);
  
  // Get color for class
  const classColor = getWowClassColor(className);
  
  // Format the class name for CSS
  const formattedClass = className.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="relative">
      <Avatar
        size={size}
        className={cn(
          "border-2",
          `border-${formattedClass}`,
          {
            "border-deathknight": formattedClass === "death-knight",
            "border-demonhunter": formattedClass === "demon-hunter",
            "border-evoker": formattedClass === "evoker",
          }
        )}
      >
        {realm ? (
          <AvatarImage 
            src={`https://render.worldofwarcraft.com/eu/character/${realm.toLowerCase()}/${name.toLowerCase()}/bust.webp`} 
            alt={name}
          />
        ) : (
          <AvatarImage 
            src={`https://render.worldofwarcraft.com/eu/icons/56/${formattedClass.toLowerCase()}.jpg`} 
            alt={name}
          />
        )}
        
        <AvatarFallback 
          className={cn(
            "text-white font-medium",
            `bg-${formattedClass}`,
            {
              "bg-deathknight": formattedClass === "death-knight",
              "bg-demonhunter": formattedClass === "demon-hunter",
              "bg-evoker": formattedClass === "evoker",
            }
          )}
        >
          {name?.charAt(0) || '?'}
        </AvatarFallback>
      </Avatar>
      
      {showRoleIcon && role && (
        <div className={cn(
          "absolute -bottom-1 -right-1 rounded-full p-0.5",
          role === 'tank' ? "bg-wow-tank" : 
          role === 'healer' ? "bg-wow-healer" : 
          "bg-wow-dps"
        )}>
          {role === 'tank' && (
            <Shield className="h-3 w-3 text-white" />
          )}
          {role === 'healer' && (
            <HeartPulse className="h-3 w-3 text-white" />
          )}
          {role === 'dps' && (
            <Swords className="h-3 w-3 text-white" />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Get the role based on character specialization
 */
function getRoleFromSpec(spec?: string): 'tank' | 'healer' | 'dps' | null {
  if (!spec) return null;
  
  const tankSpecs = [
    'protection', 'blood', 'brewmaster', 'vengeance', 'guardian', 'preservation'
  ];
  
  const healerSpecs = [
    'holy', 'discipline', 'restoration', 'mistweaver', 'augmentation'
  ];
  
  const lowercaseSpec = spec.toLowerCase();
  
  if (tankSpecs.includes(lowercaseSpec)) return 'tank';
  if (healerSpecs.includes(lowercaseSpec)) return 'healer';
  return 'dps';
}

/**
 * Get the WoW class color for a given class
 */
function getWowClassColor(className: string): string {
  const classColors: Record<string, string> = {
    'warrior': '#C79C6E',
    'paladin': '#F58CBA',
    'hunter': '#ABD473',
    'rogue': '#FFF569',
    'priest': '#FFFFFF',
    'death knight': '#C41F3B',
    'shaman': '#0070DE',
    'mage': '#69CCF0',
    'warlock': '#9482C9',
    'monk': '#00FF96',
    'druid': '#FF7D0A',
    'demon hunter': '#A330C9',
    'evoker': '#33937F',
  };
  
  return classColors[className.toLowerCase()] || '#FFFFFF';
}