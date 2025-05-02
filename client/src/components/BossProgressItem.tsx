import { formatDistanceToNow } from "date-fns";
import { useTranslation } from "react-i18next";
import type { RaidBoss } from "@shared/schema";

interface BossProgressItemProps {
  boss: RaidBoss;
  difficulty?: string;
}

export default function BossProgressItem({ boss }: BossProgressItemProps) {
  const { t } = useTranslation();
  
  // Format last kill date to relative time (e.g., "3 months ago") if available
  // But don't show any date if the boss is defeated but has no date
  const killDateRelative = boss.lastKillDate 
    ? formatDistanceToNow(new Date(boss.lastKillDate), { addSuffix: true })
    : "";

  // Only show pulls if we have actual pull count > 0
  const hasLogData = !!boss.reportUrl;
  const hasPulls = boss.pullCount !== undefined && boss.pullCount > 0;
  const pullCount = hasPulls ? boss.pullCount : null;
  
  // Only show kills if boss is defeated and we have kill count > 0
  const killCount = (boss.killCount && boss.killCount > 0) ? boss.killCount : null;
  
  // Handle boss icon URLs with fallback and safer URL handling
  let iconUrl = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  if (boss.iconUrl) {
    try {
      if (boss.iconUrl.startsWith('http')) {
        // For wikia URLs that often cause problems, replace with fallback
        if (boss.iconUrl.includes('wikia.nocookie.net')) {
          // Extract the icon name from the URL to create a safer version
          const iconName = boss.iconUrl.split('/').pop()?.split('.')[0];
          if (iconName) {
            iconUrl = `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}.jpg`;
          }
        } else {
          // For other full URLs, use as is
          iconUrl = boss.iconUrl;
        }
      } else {
        // For icon names, construct the full URL
        iconUrl = `https://wow.zamimg.com/images/wow/icons/large/${boss.iconUrl}.jpg`;
      }
    } catch (e) {
      console.error("Error processing icon URL:", e);
      // Fallback to default icon on error
      iconUrl = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
    }
  }
  
  // Calculate progress percentage for the progress bar
  // Only show progress for defeated bosses or those with logs attached and pulls
  // Use rendering calculation method that won't leak values to the DOM
  let progressValue = 0;
  if (boss.defeated) {
    progressValue = 100;
  } else if (boss.inProgress || (hasPulls && typeof pullCount === 'number' && pullCount > 0)) {
    progressValue = Math.min(Math.floor(((pullCount || 0) / 50) * 100), 95);
  }
  
  // We use the variable directly only in the style attribute to ensure it doesn't leak to the DOM
  const progressWidth = `${progressValue}%`;

  // Use completely different DOM structure to prevent zero leakage
  return (
    <div className={`relative bg-wow-dark/70 rounded-lg border border-wow-green/10 overflow-hidden hover:border-wow-green/30 transition-all shadow-md group hover:shadow-wow-green/10 animate-fade-in ${boss.defeated ? 'boss-defeated-card' : 'boss-not-defeated-card'}`}>
      {/* Status indicator */}
      <div className={`absolute top-0 left-0 w-1 h-full ${boss.defeated ? 'bg-green-500' : 'bg-amber-500'}`}></div>
      
      {/* Main content area */}
      <div className="p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center w-full">
          {/* Boss icon with complete wrapper to prevent zero leaks */}
          <div className="relative mr-3 md:mr-4 flex-shrink-0 boss-icon-wrapper" style={{zIndex: 5}}>
            {/* Glow effect behind icon */}
            <div className={`absolute inset-0 rounded-lg ${boss.defeated ? 'bg-green-500/20' : 'bg-amber-500/20'} blur-sm -m-1 group-hover:blur-md transition-all`}></div>
            
            {/* Icon container with extra styling to prevent MySQL zeros */}
            <div 
              className="w-14 h-14 flex-shrink-0 relative"
              style={{content: '""', fontSize: 0, color: 'transparent'}}
            >
              {/* Double-nested container as an extra shield against DOM leakage */}
              <div className="w-14 h-14 relative" style={{fontSize: 0, color: 'transparent'}}>
                {/* The 0 appears after non-defeated boss icons, wrapping in special container */}
                {!boss.defeated && <span style={{fontSize: 0, position: 'absolute', overflow: 'hidden', opacity: 0, height: 0, width: 0}}>0</span>}
                <img 
                  src={iconUrl} 
                  alt={boss.name} 
                  style={{content: '""'}}
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-md relative z-10 ${boss.defeated 
                    ? 'border-2 border-green-500 shadow-lg shadow-green-500/20 group-hover:shadow-green-500/40' 
                    : 'border-2 border-amber-500 shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 grayscale-[30%]'
                  } transition-all`}
                  onError={(e) => {
                    // Fallback image if the icon URL fails to load
                    (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                  }}
                />
                {/* Extra hidden container to capture any zeros */}
                {!boss.defeated && <span style={{position: 'absolute', fontSize: 0, color: 'transparent', overflow: 'hidden', opacity: 0}}>0</span>}
              </div>
            </div>
            {boss.defeated && (
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center border-2 border-wow-dark text-white z-20 group-hover:scale-110 transition-transform">
                <i className="fas fa-check text-xs"></i>
              </div>
            )}
          </div>
          
          {/* Boss name and status */}
          <div className="flex flex-col flex-grow">
            <h4 className={`font-medium text-base md:text-lg ${boss.defeated 
              ? 'text-wow-light font-semibold' 
              : 'text-wow-light/80'
            }`}>{boss.name}</h4>
            
            <div className="flex items-center mt-1 mb-1">
              {boss.defeated ? (
                <span className="text-green-400 inline-flex items-center text-xs md:text-sm font-medium">
                  <i className="fas fa-trophy mr-1 text-wow-green"></i> {t("progress.defeated")} {killDateRelative && ` ${killDateRelative}`}
                </span>
              ) : boss.inProgress || hasPulls ? (
                <span className="text-amber-400 inline-flex items-center text-xs md:text-sm font-medium">
                  <i className="fas fa-hourglass-half mr-1"></i> {t("progress.inProgress")} {hasPulls ? ` (${pullCount} ${t("progress.pulls")})` : ''}
                </span>
              ) : (
                <span className="text-wow-light/50 inline-flex items-center text-xs md:text-sm font-medium">
                  <i className="fas fa-lock mr-1"></i> {t("progress.notStarted")}
                </span>
              )}
            </div>
            
            {/* Stats row */}
            <div className="flex items-center gap-3 text-xs md:text-sm">
              {killCount && (
                <span className="text-green-400 inline-flex items-center">
                  <i className="fas fa-skull mr-1"></i> {killCount} {t("progress.kills")}
                </span>
              )}
              
              {boss.reportUrl && (
                <a 
                  href={boss.reportUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-wow-green hover:text-wow-green/80 transition-colors inline-flex items-center"
                >
                  <i className="fas fa-chart-line mr-1"></i> {t("progress.viewLogs")}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 w-full bg-wow-secondary/80 relative overflow-hidden">
        <div 
          className={`h-full ${boss.defeated 
            ? 'bg-gradient-to-r from-green-500 to-green-400' 
            : 'bg-gradient-to-r from-amber-500 to-amber-400'
          } absolute transition-all duration-700 ease-out`}
          style={{ width: progressWidth }}
        ></div>
        {/* Add subtle shine effect for defeated bosses */}
        {boss.defeated && (
          <div className="absolute top-0 right-0 h-full w-[60%] bg-gradient-to-l from-white/20 to-transparent animate-pulse"></div>
        )}
        {/* Striped animation for in-progress bosses */}
        {!boss.defeated && (boss.inProgress || hasPulls) && (
          <div 
            className="absolute inset-0 overflow-hidden bg-wow-dark progress-stripes" 
            style={{
              backgroundImage: 'linear-gradient(45deg, rgba(251, 191, 36, 0.15) 25%, transparent 25%, transparent 50%, rgba(251, 191, 36, 0.15) 50%, rgba(251, 191, 36, 0.15) 75%, transparent 75%, transparent)',
              backgroundSize: '10px 10px',
              animation: 'progress-bar-stripes 2s linear infinite',
            }}
          ></div>
        )}
      </div>
      
      {/* We've moved keyframe animation to global CSS */}
    </div>
  );
}
