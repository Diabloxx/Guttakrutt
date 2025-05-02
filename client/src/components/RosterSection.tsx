import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import RosterItem from "./RosterItem";
import type { Character } from "@/types";

interface RosterSectionProps {
  guildName: string;
  realm: string;
}

export default function RosterSection({ guildName, realm }: RosterSectionProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [displayCount, setDisplayCount] = useState(8);
  
  // Fetch roster data
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/roster', guildName, realm],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Filter characters based on search term
  const filteredCharacters = data?.characters?.filter((character: Character) => 
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.className.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // Characters to display based on current displayCount
  const displayedCharacters = filteredCharacters.slice(0, displayCount);
  
  // Format the last updated time
  const formattedLastUpdated = data?.lastUpdated 
    ? formatDistanceToNow(new Date(data.lastUpdated), { addSuffix: true })
    : "";
  
  return (
    <section id="roster" className="py-16 bg-wow-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-wow-gold mb-4">{t('guild.roster')}</h2>
          <div className="w-24 h-1 bg-wow-gold mx-auto mb-6"></div>
          <p className="text-lg text-wow-light max-w-2xl mx-auto">
            {t('character.filter')}
          </p>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Status indicator */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mb-2 sm:mb-0">
            <div className={`bg-wow-secondary px-3 py-2 rounded-lg text-xs sm:text-sm flex items-center`}>
              <i className={`fas fa-sync ${isLoading ? 'animate-spin text-amber-400' : (isError ? 'text-red-400' : 'text-green-400')} mr-2`}></i>
              <span>
                {t('misc.status')}: 
                <span className={`${isError ? 'text-red-400' : 'text-green-400'} font-medium ml-1`}>
                  {isError ? t('misc.disconnected') : (data?.apiStatus || t('misc.connected'))}
                </span>
              </span>
            </div>
            {formattedLastUpdated && (
              <div className="text-xs sm:text-sm text-wow-light/70">
                {t('misc.lastUpdated')}: <span>{formattedLastUpdated}</span>
              </div>
            )}
          </div>
          
          {/* Search bar - full width on mobile */}
          <div className="w-full sm:w-auto">
            <div className="relative">
              <input 
                type="text" 
                placeholder={t('character.searchCharacters')}
                className="bg-wow-secondary border border-wow-gold/20 rounded-md px-4 py-2 pr-10 focus:outline-none focus:border-wow-gold/50 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute right-3 top-3 text-wow-light/50"></i>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-wow-secondary rounded-lg h-24 animate-pulse"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="bg-wow-secondary/20 rounded-lg p-8 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-wow-light mb-2">{t('misc.loadFailed')}</h3>
            <p className="text-wow-light/70">
              {t('misc.apiConnectionError')}
            </p>
          </div>
        ) : displayedCharacters.length === 0 ? (
          <div className="bg-wow-secondary/20 rounded-lg p-8 text-center">
            <i className="fas fa-search text-wow-gold text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-wow-light mb-2">{t('misc.noResults')}</h3>
            <p className="text-wow-light/70">
              {t('misc.tryDifferentSearch')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
            {displayedCharacters.map((character: Character) => (
              <RosterItem key={character.id} character={character} />
            ))}
          </div>
        )}

        {!isLoading && !isError && displayCount < filteredCharacters.length && (
          <div className="text-center mt-6">
            <button 
              className="text-wow-gold border-2 border-wow-gold px-6 py-3 rounded-md hover:bg-wow-gold/10 transition font-medium relative overflow-hidden group"
              onClick={() => setDisplayCount(prev => prev + 8)}
            >
              <span className="relative z-10 flex items-center justify-center">
                <i className="fas fa-users mr-2"></i>
                {t('character.loadMore')} ({filteredCharacters.length - displayCount})
              </span>
              <div className="absolute inset-0 bg-wow-gold/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
