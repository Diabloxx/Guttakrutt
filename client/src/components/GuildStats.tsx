import type { Guild, RaidProgress } from "@/types";

interface GuildStatsProps {
  guild: Guild;
  currentProgress?: RaidProgress;
}

export default function GuildStats({ guild, currentProgress }: GuildStatsProps) {
  // Format progress string
  const progressString = currentProgress
    ? `${currentProgress.bossesDefeated}/${currentProgress.bosses} ${currentProgress.difficulty.charAt(0).toUpperCase() + currentProgress.difficulty.slice(1)} ${currentProgress.name}`
    : "Loading...";

  return (
    <section className="bg-wow-secondary py-12 border-t border-b border-wow-gold/20 animate-fade-in">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-wow-dark/50 rounded-lg p-6 text-center border border-wow-gold/10 hover:border-wow-gold/30 transition-all hover:animate-pulsate animate-slide-up delay-100">
            <i className="fas fa-server text-wow-gold text-3xl mb-4 animate-float"></i>
            <h3 className="font-cinzel text-xl mb-2 text-wow-light">Server</h3>
            <p className="text-wow-gold font-bold text-lg">{guild.realm || "Loading..."}</p>
          </div>
          
          <div className="bg-wow-dark/50 rounded-lg p-6 text-center border border-wow-gold/10 hover:border-wow-gold/30 transition-all hover:animate-pulsate animate-slide-up delay-300">
            <i className="fas fa-users text-wow-gold text-3xl mb-4 animate-float"></i>
            <h3 className="font-cinzel text-xl mb-2 text-wow-light">Members</h3>
            <p className="text-wow-gold font-bold text-lg">{guild.memberCount}</p>
          </div>
          
          <div className="bg-wow-dark/50 rounded-lg p-6 text-center border border-wow-gold/10 hover:border-wow-gold/30 transition-all hover:animate-pulsate animate-slide-up delay-500">
            <i className="fas fa-trophy text-wow-gold text-3xl mb-4 animate-float"></i>
            <h3 className="font-cinzel text-xl mb-2 text-wow-light">Current Progress</h3>
            <p className="text-wow-gold font-bold text-lg">{progressString}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
