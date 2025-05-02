import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "./ui/select";
import BossProgressItem from "./BossProgressItem";
import type { RaidProgress, RaidBoss } from "@shared/schema";

// Define response types
interface RaidProgressResponse {
  progresses: RaidProgress[];
  apiStatus: string;
  lastUpdated: string;
}

interface RaidBossesResponse {
  bosses: RaidBoss[];
  apiStatus: string;
  lastUpdated: string;
}

interface RaidProgressSectionProps {
  guildName: string;
  realm: string;
}

// List of raids in The War Within expansion
// Liberation of Undermine is the current season, so it's listed first
const WAR_WITHIN_RAIDS = ["Liberation of Undermine", "Nerub-ar Palace"];

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
  
  // Fetch Raid Progress Data
  const { 
    data: progressData, 
    isLoading: isLoadingProgress, 
    isError: isErrorProgress 
  } = useQuery<RaidProgressResponse>({
    queryKey: ['/api/raid-progress', guildName, realm],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch Boss Data for selected raid and difficulty
  const { 
    data: bossData, 
    isLoading: isLoadingBosses,
    isError: isErrorBosses,
    refetch: refetchBosses
  } = useQuery<RaidBossesResponse>({
    queryKey: ['/api/raid-bosses', guildName, realm, selectedRaid, selectedDifficulty],
    queryFn: async () => {
      const response = await fetch(`/api/raid-bosses?name=${encodeURIComponent(guildName)}&realm=${encodeURIComponent(realm)}&raid=${encodeURIComponent(selectedRaid)}&difficulty=${encodeURIComponent(selectedDifficulty)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch raid bosses');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // When the selected raid or difficulty changes, refetch the boss data
  useEffect(() => {
    refetchBosses();
  }, [selectedRaid, selectedDifficulty, refetchBosses]);
  
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
  const isWarWithinRaid = (name: string) => {
    return WAR_WITHIN_RAIDS.some(raid => name.includes(raid));
  };
  
  // Format percentage for chart - only include The War Within raids
  const progressHistory = useMemo(() => {
    if (!progressData?.progresses?.length) return [];
    
    return progressData.progresses
      .filter(progress => isWarWithinRaid(progress.name))
      .map(progress => ({
        name: progress.name.split(',')[0],
        progress: Math.round((progress.bossesDefeated / progress.bosses) * 100),
        fullName: progress.name,
        killed: `${progress.bossesDefeated}/${progress.bosses} ${progress.difficulty.charAt(0).toUpperCase()}`
      }));
  }, [progressData]);
  
  // Create filtered raid list for tab buttons
  const filteredRaids = useMemo(() => {
    if (!progressData?.progresses?.length) return [];
    
    return progressData.progresses
      .filter(progress => isWarWithinRaid(progress.name));
  }, [progressData]);
  
  // Loading and error states
  const isLoading = isLoadingProgress || isLoadingBosses;
  const isError = isErrorProgress || isErrorBosses;
  
  return (
    <section id="progress" className="py-16 bg-wow-secondary border-b-0 mb-0 pb-0">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 animate-fade-in">
          <h2 className="font-cinzel text-3xl md:text-4xl font-bold text-wow-green mb-4 animate-slide-down">{t('guild.raidProgress')}</h2>
          <div className="w-24 h-1 bg-wow-green mx-auto mb-6 animate-scale-in delay-200"></div>
          <p className="text-lg text-wow-light max-w-2xl mx-auto animate-fade-in delay-400">
            {t('progress.currentTier')}: Liberation of Undermine.
          </p>
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
              {/* Raid selection tabs */}
              {(progressData && progressData.progresses && progressData.progresses.length > 0) ? (
                // If we have progress data from the API, use it to generate tabs
                progressData.progresses
                  .filter((progress: RaidProgress) => isWarWithinRaid(progress.name))
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
                // Fallback buttons if no progress data is available - Liberation of Undermine first as it's current season
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
                  ) : currentRaidProgress && currentRaidProgress.name === "Nerub-ar Palace" ? (
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
                      ? (currentDifficultyProgress.defeated / currentDifficultyProgress.total) * 100 
                      : 0}%` 
                  }}
                >
                  {/* Shine effect */}
                  <div className="absolute top-0 right-0 h-full w-[60%] bg-gradient-to-l from-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <div className="p-4 md:p-6">
              {bossList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {bossList.map((boss: RaidBoss) => (
                    <div key={boss.id} className={`boss-card-wrapper ${boss.defeated ? 'boss-defeated' : 'boss-not-defeated'}`}>
                      <div className="boss-card boss-overflow-fix">
                        <BossProgressItem boss={boss} />
                        {/* Extra element to prevent stray text */}
                        <span className="sr-only"></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-wow-light/70 p-4">
                  {t('progress.noBossData')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Raid Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {progressHistory.length > 0 && progressHistory.map((progress: any, index: number) => (
            <div 
              key={`history-card-${index}`} 
              className={`bg-wow-dark rounded-lg overflow-hidden border border-wow-green/10 p-6 hover:border-wow-green/30 transition-all animate-slide-up ${index === 0 ? 'delay-200' : 'delay-400'}`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-cinzel text-xl font-bold text-wow-green">{progress.fullName}</h3>
                <span className="text-wow-green font-bold text-lg">{progress.killed}</span>
              </div>
              <div className="h-3 bg-wow-secondary/80 rounded-full overflow-hidden w-full">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-wow-green relative" 
                  style={{ width: `${progress.progress}%` }}
                >
                  {/* Shine effect */}
                  {progress.progress === 100 && (
                    <div className="absolute top-0 right-0 h-full w-[60%] bg-gradient-to-l from-white/20 to-transparent animate-pulse"></div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-wow-light/80">{progress.progress}% {t('progress.percentComplete')}</span>
                {progress.progress === 100 ? (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-md text-sm font-medium border border-green-500/20">
                    <i className="fas fa-check-circle mr-1"></i> {t('progress.completed')}
                  </span>
                ) : progress.name === "Nerub-ar Palace" ? (
                  <span className="bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-md text-sm font-medium border border-indigo-500/20">
                    <i className="fas fa-history mr-1"></i> {t('progress.previousTier')}
                  </span>
                ) : (
                  <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-md text-sm font-medium border border-amber-500/20">
                    <i className="fas fa-clock mr-1"></i> {t('progress.inProgress')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
