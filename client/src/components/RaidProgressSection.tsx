import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import BossProgressItem from "./BossProgressItem";
import type { RaidProgress, RaidBoss, Expansion, RaidTier } from "@shared/schema";

// Define response types
interface RaidProgressResponse {
  progresses: RaidProgress[];
  apiStatus: string;
  lastUpdated: string;
}

interface RaidBossesResponse {
  bosses: RaidBoss[];
  apiStatus: string;
  lastUpdated?: string;
  difficulty?: string;
  tier?: RaidTier;
}

interface ExpansionsResponse {
  expansions: Expansion[];
  currentExpansion: Expansion;
  apiStatus: string;
}

interface RaidTiersResponse {
  tiers: RaidTier[];
  currentTier: RaidTier;
  apiStatus: string;
}

interface RaidProgressSectionProps {
  guildName: string;
  realm: string;
}

// Default fallback list of raids in The War Within expansion
// Used if the API doesn't return proper expansion/tier data
const DEFAULT_RAIDS = ["Liberation of Undermine", "Nerub-ar Palace"];

// Difficulty options
const DIFFICULTIES = [
  { value: "mythic", label: "Mythic" },
  { value: "heroic", label: "Heroic" },
  { value: "normal", label: "Normal" }
];

export default function RaidProgressSection({ guildName, realm }: RaidProgressSectionProps) {
  const { t } = useTranslation();
  const [selectedRaid, setSelectedRaid] = useState("Liberation of Undermine");
  const [selectedDifficulty, setSelectedDifficulty] = useState("mythic");
  const [selectedExpansion, setSelectedExpansion] = useState<number | null>(null);
  
  // Fetch Raid Progress Data
  const { 
    data: progressData, 
    isLoading: isLoadingProgress, 
    isError: isErrorProgress 
  } = useQuery<RaidProgressResponse>({
    queryKey: ['/api/raid-progress', guildName, realm],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch expansion data
  const {
    data: expansionData,
    isLoading: isLoadingExpansions,
    isError: isErrorExpansions
  } = useQuery<ExpansionsResponse>({
    queryKey: ['/api/expansions'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch raid tier data
  const {
    data: raidTierData,
    isLoading: isLoadingTiers,
    isError: isErrorTiers
  } = useQuery<RaidTiersResponse>({
    queryKey: ['/api/raid-tiers'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Get current expansion information
  const currentExpansion = useMemo(() => {
    return expansionData?.currentExpansion || null;
  }, [expansionData]);
  
  // Get current raid tier information
  const currentTier = useMemo(() => {
    return raidTierData?.currentTier || null;
  }, [raidTierData]);
  
  // Find the selected raid's tier ID
  const selectedRaidTierId = useMemo(() => {
    if (!raidTierData?.tiers || !selectedRaid) return null;
    
    // Find the tier that matches the selected raid name
    const tier = raidTierData.tiers.find(tier => tier.name === selectedRaid);
    return tier?.id || null;
  }, [raidTierData, selectedRaid]);
  
  // Fetch Boss Data for selected raid tier and difficulty
  const { 
    data: bossData, 
    isLoading: isLoadingBosses,
    isError: isErrorBosses,
    refetch: refetchBosses
  } = useQuery<RaidBossesResponse>({
    queryKey: ['/api/raid-bosses', selectedRaidTierId, selectedDifficulty],
    queryFn: async () => {
      // Default to the guild-specific boss data API if tier ID is not available
      if (!selectedRaidTierId) {
        const response = await fetch(`/api/raid-bosses?name=${encodeURIComponent(guildName)}&realm=${encodeURIComponent(realm)}&raid=${encodeURIComponent(selectedRaid)}&difficulty=${encodeURIComponent(selectedDifficulty)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch raid bosses');
        }
        return response.json();
      }
      
      // Use the new tier-based API if we have a tier ID
      const response = await fetch(`/api/raid-bosses/by-tier/${selectedRaidTierId}?difficulty=${encodeURIComponent(selectedDifficulty)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch raid bosses by tier');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: raidTierData !== undefined // Only run this query when raid tier data is available
  });
  
  // When the selected raid, tier ID, or difficulty changes, refetch the boss data
  useEffect(() => {
    if (selectedRaidTierId) {
      refetchBosses();
    }
  }, [selectedRaid, selectedRaidTierId, selectedDifficulty, refetchBosses]);
  
  // Safely access bosses array with proper typing
  const bossList = bossData && Array.isArray(bossData.bosses) ? bossData.bosses : [];
  
  // Calculate the current progress for the selected difficulty
  const currentDifficultyProgress = useMemo(() => {
    if (!bossList.length) return { defeated: 0, total: 0 };
    
    const totalBosses = bossList.length;
    const defeatedBosses = bossList.filter(boss => boss.defeated).length;
    
    return {
      defeated: defeatedBosses,
      total: totalBosses
    };
  }, [bossList]);
  
  // Format the last updated time
  const formattedLastUpdated = progressData?.lastUpdated 
    ? formatDistanceToNow(new Date(progressData.lastUpdated), { addSuffix: true })
    : "";
  
  // Get current raid progress
  const currentRaidProgress = useMemo(() => {
    if (!progressData?.progresses?.length) return null;
    return progressData.progresses.find(progress => progress.name === selectedRaid);
  }, [progressData, selectedRaid]);
  
  // Filter out only The War Within raids for the chart
  const isCurrentExpansionRaid = (name: string) => {
    if (currentExpansion && raidTierData?.tiers) {
      // If we have the new tier data, check if raid is in the current expansion's tiers
      const tierNames = raidTierData.tiers
        .filter(tier => tier.expansionId === currentExpansion.id)
        .map(tier => tier.name);
      return tierNames.some(tierName => name.includes(tierName));
    } else {
      // Fall back to hardcoded raids if we don't have tier data
      return DEFAULT_RAIDS.some(raid => name.includes(raid));
    }
  };
  
  // Format percentage for chart - dynamically include all raid tiers from selected expansion
  const progressHistory = useMemo(() => {
    // If we have tier data, use that to generate complete history
    if (raidTierData?.tiers) {
      const expansionId = selectedExpansion || (currentExpansion?.id || null);
      if (!expansionId) return []; // No expansion selected or available
      
      console.log(`Generating raid history for expansion ID: ${expansionId}`);
      
      // Filter tiers to only include those from the selected expansion
      const tiersInSelectedExpansion = raidTierData.tiers
        .filter(tier => tier.expansionId === expansionId)
        .sort((a, b) => (b.order || 0) - (a.order || 0)); // Sort by order descending (newest first)
      
      console.log(`Found ${tiersInSelectedExpansion.length} tiers for this expansion`, tiersInSelectedExpansion);
      
      // Map each tier to a raid history item
      return tiersInSelectedExpansion.map(tier => {
        // Find matching progress data if available
        const matchingProgress = progressData?.progresses?.find(p => p.name === tier.name);
        
        if (matchingProgress) {
          // Format the difficulty properly - get first character and make it uppercase
          const difficultyInitial = matchingProgress.difficulty ? 
            matchingProgress.difficulty.charAt(0).toUpperCase() : 'M';
          
          return {
            name: tier.name.split(',')[0],
            progress: Math.round((matchingProgress.bossesDefeated / matchingProgress.bosses) * 100),
            fullName: tier.name,
            killed: `${matchingProgress.bossesDefeated}/${matchingProgress.bosses} ${difficultyInitial}`
          };
        } else {
          // Include the tier even if we don't have progress data for it yet
          return {
            name: tier.name.split(',')[0],
            progress: 0,
            fullName: tier.name,
            killed: `0/? M` // Default to Mythic with unknown total bosses
          };
        }
      });
    }
    
    // Fall back to the original implementation if we don't have tier data
    if (!progressData?.progresses?.length) return [];
    
    return progressData.progresses
      .filter(progress => isCurrentExpansionRaid(progress.name))
      .map(progress => {
        // Format the difficulty properly - get first character and make it uppercase
        const difficultyInitial = progress.difficulty && progress.difficulty !== '{{difficulty}}' 
          ? progress.difficulty.charAt(0).toUpperCase() 
          : 'M'; // Default to M if difficulty is missing or has the template placeholder
          
        return {
          name: progress.name.split(',')[0],
          progress: Math.round((progress.bossesDefeated / progress.bosses) * 100),
          fullName: progress.name,
          killed: `${progress.bossesDefeated}/${progress.bosses} ${difficultyInitial}`
        };
      });
  }, [progressData, isCurrentExpansionRaid, raidTierData, currentExpansion, selectedExpansion]);
  
  // Set the initial raid tier and expansion when data loads
  useEffect(() => {
    if (raidTierData?.currentTier && raidTierData.currentTier.name) {
      setSelectedRaid(raidTierData.currentTier.name);
    }
    
    if (expansionData?.currentExpansion?.id) {
      setSelectedExpansion(expansionData.currentExpansion.id);
    }
  }, [raidTierData, expansionData]);
  
  // Update the selected raid when the expansion changes to select the newest raid in that expansion
  useEffect(() => {
    if (selectedExpansion && raidTierData?.tiers) {
      // Find the highest order (newest) tier in the selected expansion
      const tiersInExpansion = raidTierData.tiers
        .filter(tier => tier.expansionId === selectedExpansion)
        .sort((a, b) => (b.order || 0) - (a.order || 0));
      
      if (tiersInExpansion.length > 0) {
        // Select the newest raid tier from this expansion
        setSelectedRaid(tiersInExpansion[0].name);
        console.log(`Switching to raid tier: ${tiersInExpansion[0].name} for expansion ${selectedExpansion}`);
      }
    }
  }, [selectedExpansion, raidTierData]);
  
  // Create filtered raid list for tab buttons
  const filteredRaids = useMemo(() => {
    if (!progressData?.progresses?.length) return [];
    
    return progressData.progresses
      .filter(progress => isCurrentExpansionRaid(progress.name));
  }, [progressData, isCurrentExpansionRaid]);
  
  // Update current tier description
  const currentTierDescription = useMemo(() => {
    if (currentTier) {
      return currentTier.name;
    }
    return "Liberation of Undermine";
  }, [currentTier]);

  // Loading and error states
  const isLoading = isLoadingProgress || isLoadingBosses || isLoadingExpansions || isLoadingTiers;
  const isError = isErrorProgress || isErrorBosses || isErrorExpansions || isErrorTiers;
  
  return (
    <section id="progress" className="py-16 bg-wow-secondary border-b-0 mb-0 pb-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 animate-fade-in">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-wow-green mb-4 animate-slide-down">{t('guild.raidProgress')}</h2>
          <div className="w-24 h-1 bg-wow-green mx-auto mb-6 animate-scale-in delay-200"></div>
          <p className="text-lg text-wow-light max-w-2xl mx-auto animate-fade-in delay-400">
            {t('progress.currentTier')}: {currentTierDescription}
          </p>
          
          {/* Expansion selector */}
          {expansionData?.expansions && expansionData.expansions.length > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex flex-wrap gap-2 justify-center">
                {expansionData.expansions
                  .sort((a, b) => (b.order || 0) - (a.order || 0)) // Newest first
                  .map(expansion => (
                    <button
                      key={`expansion-${expansion.id}`}
                      onClick={() => setSelectedExpansion(expansion.id)}
                      className={`px-4 py-2 rounded-md font-medium text-sm md:text-base transition-colors
                        ${selectedExpansion === expansion.id
                          ? 'bg-wow-green/90 text-wow-dark font-bold'
                          : 'bg-wow-dark/80 border border-wow-green/20 text-wow-light hover:bg-wow-dark'
                        }`}
                    >
                      {expansion.name}
                      {expansion.id === expansionData.currentExpansion?.id && (
                        <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-wow-green/30 text-wow-light">
                          {t('progress.current')}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className={`bg-wow-dark px-4 py-2 rounded-lg text-sm flex items-center`}>
              <i className={`fas fa-sync ${isLoading ? 'animate-spin text-amber-400' : (isError ? 'text-red-400' : 'text-green-400')} mr-2`}></i>
              <span>
                {t('misc.status')}: 
                <span className={`${isError ? 'text-red-400' : 'text-green-400'} font-medium ml-1`}>
                  {isError ? t('misc.disconnected') : (progressData?.apiStatus || t('misc.connected'))}
                </span>
              </span>
            </div>
            {formattedLastUpdated && (
              <div className="text-sm text-wow-light/70">
                {t('misc.lastUpdated')}: <span>{formattedLastUpdated}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="flex gap-2 min-w-max">
              {/* Raid selection tabs - Prioritize using raid tier data from the new tier system */}
              {raidTierData?.tiers && raidTierData.tiers.length > 0 ? (
                // Generate buttons from raid tier data (new tier system)
                raidTierData.tiers
                  .filter(tier => {
                    // Show tiers from selected expansion if one is selected, otherwise show current expansion tiers
                    if (selectedExpansion) {
                      return tier.expansionId === selectedExpansion;
                    } else if (currentExpansion) {
                      return tier.expansionId === currentExpansion.id;
                    }
                    return true; // Show all if we can't determine which expansion to show
                  })
                  .sort((a, b) => {
                    // Sort by order descending (highest first - newest raid at start)
                    return (b.order || 0) - (a.order || 0);
                  })
                  .map(tier => {
                    // Find matching progress data if available
                    const matchingProgress = progressData?.progresses?.find(p => p.name === tier.name);
                    return (
                      <button 
                        key={`raid-tier-${tier.id}`}
                        onClick={() => setSelectedRaid(tier.name)}
                        className={`px-3 py-2 rounded-md font-medium focus:outline-none transition-colors text-sm md:text-base whitespace-nowrap
                          ${selectedRaid === tier.name 
                            ? 'bg-wow-green text-wow-dark' 
                            : 'bg-wow-dark border border-wow-green/20 text-wow-light hover:bg-wow-dark/80'
                          }`}
                        disabled={isLoading}
                      >
                        {/* Show shortened name if it's too long */}
                        {tier.shortName || tier.name.split(" ")[0]}
                        {/* Display progress if available */}
                        {matchingProgress && (
                          <span className="ml-1 text-xs md:text-sm">
                            ({matchingProgress.bossesDefeated}/{matchingProgress.bosses})
                          </span>
                        )}
                      </button>
                    );
                  })
              ) : progressData?.progresses && progressData.progresses.length > 0 ? (
                // Fallback to progress data if tier data is not available
                progressData.progresses
                  .filter((progress: RaidProgress) => isCurrentExpansionRaid(progress.name))
                  .map((progress: RaidProgress) => (
                    <button 
                      key={`raid-tab-${progress.id}`}
                      onClick={() => setSelectedRaid(progress.name)}
                      className={`px-3 py-2 rounded-md font-medium focus:outline-none transition-colors text-sm md:text-base whitespace-nowrap
                        ${selectedRaid === progress.name 
                          ? 'bg-wow-green text-wow-dark' 
                          : 'bg-wow-dark border border-wow-green/20 text-wow-light hover:bg-wow-dark/80'
                        }`}
                      disabled={isLoading}
                    >
                      {progress.name.length > 20 ? progress.name.split(" ")[0] : progress.name}
                      <span className="ml-1 text-xs md:text-sm">
                        ({progress.bossesDefeated}/{progress.bosses})
                      </span>
                    </button>
                  ))
              ) : (
                // Ultimate fallback if neither tier data nor progress data is available
                <>
                  <button 
                    key="raid-tab-undermine"
                    onClick={() => setSelectedRaid("Liberation of Undermine")}
                    className={`px-3 py-2 rounded-md font-medium focus:outline-none transition-colors text-sm md:text-base whitespace-nowrap
                      ${selectedRaid === "Liberation of Undermine" 
                        ? 'bg-wow-green text-wow-dark' 
                        : 'bg-wow-dark border border-wow-green/20 text-wow-light hover:bg-wow-dark/80'
                      }`}
                  >
                    Liberation
                  </button>
                  <button 
                    key="raid-tab-nerub"
                    onClick={() => setSelectedRaid("Nerub-ar Palace")}
                    className={`px-3 py-2 rounded-md font-medium focus:outline-none transition-colors text-sm md:text-base whitespace-nowrap
                      ${selectedRaid === "Nerub-ar Palace" 
                        ? 'bg-wow-green text-wow-dark' 
                        : 'bg-wow-dark border border-wow-green/20 text-wow-light hover:bg-wow-dark/80'
                      }`}
                  >
                    Nerub-ar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current Raid Progress */}
        {isLoading ? (
          <div className="bg-wow-dark rounded-lg overflow-hidden border border-wow-green/10 mb-8 h-96 animate-pulse"></div>
        ) : isError ? (
          <div className="bg-wow-dark rounded-lg overflow-hidden border border-wow-green/10 mb-8 p-8 text-center">
            <i className="fas fa-exclamation-triangle text-red-400 text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-wow-light mb-2">{t('misc.loadFailed')}</h3>
            <p className="text-wow-light/70">
              {t('misc.apiConnectionError')}
            </p>
          </div>
        ) : (
          <div className="bg-wow-dark rounded-lg overflow-hidden border border-wow-green/10 mb-8 animate-scale-in delay-100">
            <div className="p-6 border-b border-wow-green/10 bg-gradient-to-r from-wow-dark to-wow-dark/90">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-fade-in delay-300">
                <div>
                  <h3 className="font-cinzel text-2xl font-bold text-wow-green mb-1">{currentRaidProgress?.name || selectedRaid}</h3>
                  <div className="flex items-center gap-3">
                    <p className="text-wow-light/70 flex items-center">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        currentRaidProgress?.bossesDefeated === currentRaidProgress?.bosses 
                          ? 'bg-green-500'
                          : 'bg-amber-500'
                      }`}></span>
                      {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)}: 
                      <span className="text-wow-light ml-1 font-medium">
                        {`${currentDifficultyProgress.defeated}/${currentDifficultyProgress.total}`}
                      </span>
                    </p>
                    
                    {/* Difficulty selector */}
                    <Select
                      value={selectedDifficulty}
                      onValueChange={(value) => setSelectedDifficulty(value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 bg-wow-dark border-wow-green/20 focus:ring-wow-green">
                        <SelectValue placeholder={t('progress.selectDifficulty')} />
                      </SelectTrigger>
                      <SelectContent className="bg-wow-dark border-wow-green/20">
                        <SelectGroup>
                          <SelectLabel className="text-wow-green">{t('progress.difficulty')}</SelectLabel>
                          {DIFFICULTIES.map((diff) => (
                            <SelectItem key={diff.value} value={diff.value} className="text-wow-light hover:text-wow-green">
                              {t(`misc.difficulty.${diff.value}`)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {currentDifficultyProgress.defeated === currentDifficultyProgress.total && currentDifficultyProgress.total > 0 ? (
                    <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-medium border border-green-500/20">
                      <i className="fas fa-check-circle mr-1"></i> {t('progress.complete', { difficulty: t(`misc.difficulty.${selectedDifficulty}`) })}
                    </span>
                  ) : currentRaidProgress && raidTierData?.tiers && raidTierData.currentTier && raidTierData.currentTier.name !== currentRaidProgress.name ? (
                    <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-md text-sm font-medium border border-indigo-500/20">
                      <i className="fas fa-history mr-1"></i> {t('progress.previousTier')}
                    </span>
                  ) : (
                    <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-md text-sm font-medium border border-amber-500/20">
                      <i className="fas fa-clock mr-1"></i> {t('progress.inProgress')}
                    </span>
                  )}
                  {currentRaidProgress?.worldRank && (
                    <span className="bg-wow-green/10 text-wow-green px-3 py-1 rounded-md text-sm font-medium border border-wow-green/20">
                      <i className="fas fa-trophy mr-1"></i> {t('progress.worldRank', { rank: currentRaidProgress.worldRank })}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4 h-2 bg-wow-secondary/80 rounded-full overflow-hidden w-full animate-fade-in delay-500">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-wow-green relative transition-all duration-1000" 
                  style={{ 
                    width: `${currentDifficultyProgress.total > 0 
                      ? Math.round((currentDifficultyProgress.defeated / currentDifficultyProgress.total) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Boss List */}
            <div className="p-4 md:p-6 space-y-2">
              {bossList.length > 0 ? (
                <>
                  {/* Using an outer div with special CSS class to control MySQL artifact display */}
                  <div className="mysql-fix-wrapper">
                    {/* Fixed 2-column grid with equal width/height cells */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {bossList
                        .sort((a, b) => (a.bossOrder || 0) - (b.bossOrder || 0)) // Sort by boss_order field
                        .map(boss => (
                          /* Each boss card is wrapped in another div to isolate any text rendering */
                          <div key={boss.id} className="boss-card-outer-wrapper" style={{fontSize: 0, color: 'transparent'}}>
                            <BossProgressItem 
                              boss={boss} 
                              difficulty={selectedDifficulty}
                            />
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-dragon text-wow-light/20 text-5xl mb-4"></i>
                  <p className="text-wow-light/60">{t('progress.noBossData')}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Progress History */}
        {progressHistory.length > 0 && (
          <div className="space-y-6 mb-4">
            <h3 className="font-cinzel text-xl font-bold text-center text-wow-green mb-4">{t('progress.raidHistory')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {progressHistory.map((raid) => (
                <div 
                  key={raid.name}
                  className="bg-wow-dark rounded-lg overflow-hidden border border-wow-green/10 p-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-wow-light text-lg">{raid.fullName}</h4>
                    <span className="text-sm font-semibold text-wow-light/90 bg-wow-secondary/50 px-2 py-1 rounded">{raid.killed}</span>
                  </div>
                  <div className="h-4 bg-wow-secondary/80 rounded-full overflow-hidden w-full mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-wow-green" 
                      style={{ width: `${raid.progress}%` }}
                    ></div>
                  </div>
                  {/* Add label showing percentage */}
                  <div className="text-right text-sm text-wow-light/70 mt-1">
                    <span>{raid.progress}% {t('progress.percentComplete').toLowerCase()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}