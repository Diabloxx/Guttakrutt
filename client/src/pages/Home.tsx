import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import GuildStats from "@/components/GuildStats";
import RosterSection from "@/components/RosterSection";
import RaidProgressSection from "@/components/RaidProgressSection";
import AboutSection from "@/components/AboutSection";
import RecruitmentSection from "@/components/RecruitmentSection";
import Footer from "@/components/Footer";
import { Guild, RaidProgress } from "@/types";
import { useAuth } from "@/contexts/auth-context";

// Default guild info
const DEFAULT_GUILD_NAME = "Guttakrutt";
const DEFAULT_REALM = "Tarren Mill";

export default function Home() {
  // Access auth context to handle special logout flow
  const { refreshAuth } = useAuth();
  
  // Check for clear_session parameter to handle post-logout redirects
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clearSession = params.get('clear_session');
    
    if (clearSession) {
      console.log('Post-logout redirect detected, refreshing auth state');
      
      // Force a refresh of auth state to ensure we're truly logged out
      refreshAuth();
      
      // Remove the clear_session parameter to avoid refreshing on reload
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, [refreshAuth]);
  
  // State for guild info
  const [guildInfo, setGuildInfo] = useState({
    name: DEFAULT_GUILD_NAME,
    realm: DEFAULT_REALM
  });
  
  // Fetch Guild data
  const { data: guild, isLoading, isError } = useQuery<Guild>({
    queryKey: ['/api/guild', guildInfo.name, guildInfo.realm],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Fetch current raid progress for stats section
  const { data: progressData } = useQuery<{ progresses: RaidProgress[], apiStatus: string, lastUpdated: string }>({
    queryKey: ['/api/raid-progress', guildInfo.name, guildInfo.realm],
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!guild, // Only run this query after guild data is loaded
  });
  
  // Get current raid progress to display in stats section - prioritize Liberation of Undermine
  const currentProgress = progressData?.progresses?.find(progress => 
    progress.name === "Liberation of Undermine" && progress.difficulty === "mythic"
  ) || progressData?.progresses?.find(progress => 
    progress.name === "Nerub-ar Palace" && progress.difficulty === "mythic"
  ) || progressData?.progresses?.[0];
  
  // Loading state
  if (isLoading) {
    return (
      <div className="bg-wow-dark text-wow-light min-h-screen flex flex-col justify-center items-center">
        <svg className="animate-spin h-12 w-12 text-wow-gold mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-xl font-bold text-wow-gold">Loading guild data...</h2>
      </div>
    );
  }
  
  // Error state
  if (isError) {
    return (
      <div className="bg-wow-dark text-wow-light min-h-screen flex flex-col justify-center items-center p-4">
        <div className="bg-wow-secondary p-8 rounded-lg max-w-md text-center">
          <i className="fas fa-exclamation-triangle text-red-500 text-5xl mb-4"></i>
          <h2 className="text-2xl font-bold text-wow-gold mb-4">Failed to load guild data</h2>
          <p className="text-wow-light/80 mb-6">
            Unable to connect to the API. Please check your internet connection and try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-wow-gold text-wow-dark font-bold py-2 px-6 rounded-md hover:bg-amber-400 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Default guild data if API returns nothing
  const guildData: Guild = guild || {
    id: 1,
    name: DEFAULT_GUILD_NAME,
    realm: DEFAULT_REALM,
    faction: "Horde",
    description: "An elite raiding guild dedicated to competitive PvE progression",
    memberCount: 0,
    lastUpdated: new Date().toISOString(),
    emblemUrl: "",
    serverRegion: "eu"
  };
  
  return (
    <div className="min-h-screen bg-wow-dark text-wow-light flex flex-col">
      {/* Header */}
      <Header guildName={guildData.name} emblemUrl={guildData.emblemUrl} />
      
      {/* Main Content */}
      <main className="flex-grow">
        <HeroSection guild={guildData} />
        <GuildStats guild={guildData} currentProgress={currentProgress} />
        <RosterSection guildName={guildData.name} realm={guildData.realm} />
        <RaidProgressSection guildName={guildData.name} realm={guildData.realm} />
        <RecruitmentSection guild={guildData} />
        <AboutSection guild={guildData} />
      </main>
      
      {/* Footer */}
      <Footer guildName={guildData.name} emblemUrl={guildData.emblemUrl} />
      
      {/* FontAwesome script */}
      <link 
        rel="stylesheet" 
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css"
        integrity="sha512-MV7K8+y+gLIBoVD59lQIYicR65iaqukzvf/nwasF0nqhPay5w/9lJmVM2hMDcnK1OnMGCdVK+iQrJ7lzPJQd1w=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
