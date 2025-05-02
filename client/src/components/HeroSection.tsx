import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import type { Guild } from "@/types";
import guildLogoBg from "../assets/guttakrutt-logo-bg.png";

interface HeroSectionProps {
  guild: Guild;
}

export default function HeroSection({ guild }: HeroSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section 
      id="home" 
      className="relative flex items-center justify-center bg-wow-dark overflow-hidden" 
      style={{ 
        minHeight: '100vh'
      }}
    >
      {/* Background image that scales to fill the entire area */}
      <div 
        className="absolute inset-0 bg-center bg-no-repeat w-full h-full"
        style={{
          backgroundImage: `url(${guildLogoBg})`,
          backgroundSize: 'cover',
          transform: 'scale(1.02)', /* Slight scale to avoid white edges during transitions */
          filter: 'brightness(0.95)' /* Slightly darken the image */
        }}
      ></div>
      
      {/* Semi-transparent overlay to improve text readability */}
      <div className="absolute inset-0 bg-wow-dark opacity-40"></div>
      
      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-cinzel text-4xl md:text-5xl lg:text-6xl text-wow-green mb-4 animate-slide-down"
              style={{ textShadow: '0 0 10px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 0, 0, 0.6)' }}>
            {t('heroSection.title')}
          </h2>
          
          <p className="text-xl md:text-2xl mb-8 text-wow-light font-medium animate-fade-in delay-300" 
             style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.9)' }}>
            {t('heroSection.subtitle')}
          </p>
          
          <div className={`bg-${guild.faction.toLowerCase()} inline-flex px-3 py-1 rounded-full text-white text-sm font-semibold mb-6 animate-fade-in delay-500 animate-pulsate`}>
            <i className="fa fa-flag mr-2"></i> {guild.faction}
          </div>
          
          <p className="text-xl md:text-2xl mb-10 text-wow-green italic font-cinzel animate-fade-in delay-700"
             style={{ textShadow: '0 2px 4px rgba(0, 0, 0, 1), 0 0 10px rgba(0, 0, 0, 0.8)' }}>
            "{t('heroSection.motto')}"
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 animate-slide-up delay-900">
            <a 
              href="#roster" 
              className="bg-wow-dark text-wow-green font-bold py-3 px-6 rounded-md border-2 border-wow-green hover:bg-wow-green hover:text-wow-dark transition hover:animate-pulsate animate-glow"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('roster');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {t('guild.roster')}
            </a>
            <a 
              href="#progress" 
              className="bg-wow-dark text-wow-light font-bold py-3 px-6 rounded-md border-2 border-wow-light hover:bg-wow-light hover:text-wow-dark transition hover:animate-pulsate"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById('progress');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {t('heroSection.raidProgress')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}