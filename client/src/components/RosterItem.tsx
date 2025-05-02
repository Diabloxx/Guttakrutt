import { getClassColor, getClassIconUrl } from "@/constants/classColors";
import { getRankName } from "@/types";
import { useTranslation } from "react-i18next";
import type { Character } from "@/types";

interface RosterItemProps {
  character: Character;
}

export default function RosterItem({ character }: RosterItemProps) {
  const { t } = useTranslation();
  const classColor = getClassColor(character.className);
  const classIconUrl = getClassIconUrl(character.className);
  const rankName = getRankName(character.rank);
  
  // Role icon based on character role
  const getRoleIcon = (role: string | null) => {
    if (!role) return null;
    
    const roleLower = role.toLowerCase();
    if (roleLower === 'tank') return 'https://static.wikia.nocookie.net/wowwiki/images/7/7e/Icon-class-role-tank-42x42.png';
    if (roleLower === 'dps') return 'https://static.wikia.nocookie.net/wowwiki/images/3/3f/Icon-class-role-dealer-42x42.png';
    if (roleLower === 'healing') return 'https://static.wikia.nocookie.net/wowwiki/images/0/07/Icon-class-role-healer-42x42.png';
    return null;
  };
  
  // Format Raider.IO score with color
  const formatScore = (score?: number | null) => {
    if (score === undefined || score === null || score === 0) return null;
    
    let scoreColor = 'text-white';
    if (score >= 3000) scoreColor = 'text-amber-400';
    else if (score >= 2500) scoreColor = 'text-orange-300';
    else if (score >= 2000) scoreColor = 'text-purple-400';
    else if (score >= 1500) scoreColor = 'text-blue-300';
    else if (score >= 1000) scoreColor = 'text-green-400';
    
    return <span className={`${scoreColor} text-xs font-semibold`}>{score}</span>;
  };
  
  // Build proper armory link with realm
  const getArmoryLink = () => {
    const realm = character.realm || 'tarren-mill';
    const formattedRealm = realm.toLowerCase().replace(/\s+/g, '-');
    return `https://worldofwarcraft.blizzard.com/en-us/character/eu/${formattedRealm}/${character.name.toLowerCase()}`;
  };

  return (
    <div className="bg-wow-secondary rounded-lg overflow-hidden border border-wow-gold/10 hover:border-wow-gold/30 transition-all group">
      <div className={`h-2 ${classColor.bgColor}`}></div>
      <div className="p-4 flex items-center">
        <img 
          src={classIconUrl} 
          alt={character.className} 
          className={`w-12 h-12 rounded-full mr-4 border-2 border-${classColor.color}`}
        />
        <div className="flex-grow">
          <div className="flex items-center">
            <h3 className={`${classColor.textColor} font-medium text-lg`}>{character.name}</h3>
            {character.role && (
              <div className="ml-2 flex-none">
                <img 
                  src={getRoleIcon(character.role)} 
                  alt={character.role}
                  className="w-5 h-5"
                  title={character.role}
                />
              </div>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-wow-light/70">{character.className}</span>
              {character.specName && (
                <>
                  <span className="mx-1 text-wow-light/30">•</span>
                  <span className="text-sm text-wow-light/70">{character.specName}</span>
                </>
              )}
            </div>
            <span className="text-sm text-wow-light/50 italic">{rankName}</span>
          </div>
          {(character.raiderIoScore || character.itemLevel) && (
            <div className="flex items-center justify-between mt-1">
              {character.itemLevel && (
                <div className="flex items-center">
                  <span className="text-xs text-wow-light/70">iLvl:</span>
                  <span className="ml-1 text-xs text-wow-light">{character.itemLevel}</span>
                </div>
              )}
              {character.raiderIoScore && (
                <div className="flex items-center">
                  <span className="text-xs text-wow-light/70">M+:</span>
                  <span className="ml-1">{formatScore(character.raiderIoScore)}</span>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <a 
            href={getArmoryLink()} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-wow-light/70 hover:text-wow-gold"
            title={t('character.viewProfile')}
          >
            <i className="fas fa-external-link-alt"></i>
          </a>
        </div>
      </div>
    </div>
  );
}
