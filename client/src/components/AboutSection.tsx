import type { Guild } from "@/types";
import { useTranslation } from "react-i18next";
import guildLogo from "../assets/guild-logo.png";

interface AboutSectionProps {
  guild: Guild;
}

export default function AboutSection({ guild }: AboutSectionProps) {
  const { t } = useTranslation();
  
  return (
    <section id="about" className="py-10 md:py-16 bg-wow-dark">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <div className="flex justify-center mb-4 md:mb-6">
            <div className="relative">
              <img 
                src={guildLogo} 
                alt="Guttakrutt Logo"
                className="h-32 sm:h-40 md:h-48 object-contain max-w-none"
                style={{ 
                  filter: 'drop-shadow(0 0 8px rgba(171, 244, 0, 0.5))',
                  transform: 'scale(1.05)'
                }}
              />
            </div>
          </div>
          <h2 className="font-cinzel text-2xl sm:text-3xl md:text-4xl font-bold text-wow-green mb-3 md:mb-4">{t('about.title')}</h2>
          <div className="w-16 md:w-24 h-1 bg-wow-green mx-auto mb-4 md:mb-6"></div>
          <p className="text-base sm:text-lg text-wow-light max-w-3xl mx-auto">
            {t('about.learnAbout')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
          <div className="bg-wow-secondary rounded-lg overflow-hidden border border-wow-green/10">
            <div className="p-6">
              <div className="text-wow-green text-3xl mb-4">
                <i className="fas fa-book-open"></i>
              </div>
              <h3 className="font-cinzel text-xl font-bold text-wow-green mb-4">{t('about.ourHistory')}</h3>
              <p className="text-wow-light/80 mb-4">
                {t('about.foundedText')} {guild.realm}.
              </p>
              <p className="text-wow-light/80">
                {t('about.welcomingEnv')}
              </p>
            </div>
          </div>

          <div className="bg-wow-secondary rounded-lg overflow-hidden border border-wow-green/10">
            <div className="p-6">
              <div className="text-wow-green text-3xl mb-4">
                <i className="fas fa-calendar-alt"></i>
              </div>
              <h3 className="font-cinzel text-xl font-bold text-wow-green mb-4">{t('about.raidTeams')}</h3>
              <div className="mb-4">
                <h4 className="text-wow-green font-semibold mb-2">{t('about.mainTeam')}</h4>
                <ul className="text-wow-light/80 space-y-1">
                  <li className="flex items-center">
                    <i className="fas fa-clock text-wow-green mr-2"></i>
                    <span>Wednesday: 19:20-23:00 ST</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-clock text-wow-green mr-2"></i>
                    <span>Sunday: 19:20-23:00 ST</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-trophy text-wow-green mr-2"></i>
                    <span>{t('about.goal')}</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-wow-green font-semibold mb-2">{t('about.secondTeam')}</h4>
                <ul className="text-wow-light/80 space-y-1">
                  <li className="flex items-center">
                    <i className="fas fa-clock text-wow-green mr-2"></i>
                    <span>Monday: 20:00-23:00 ST</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-users text-wow-green mr-2"></i>
                    <span>{t('about.casualApproach')}</span>
                  </li>
                </ul>
              </div>
              <p className="text-wow-light/60 text-sm mt-4">{t('about.serverTime')}</p>
            </div>
          </div>

          <div className="bg-wow-secondary rounded-lg overflow-hidden border border-wow-green/10">
            <div className="p-6">
              <div className="text-wow-green text-3xl mb-4">
                <i className="fas fa-user-plus"></i>
              </div>
              <h3 className="font-cinzel text-xl font-bold text-wow-green mb-4">{t('about.joinUs')}</h3>
              <p className="text-wow-light/80 mb-4">
                {t('about.recruiting')}
              </p>
              
              <div className="mb-4">
                <h4 className="text-wow-green font-semibold mb-2">{t('about.mainMythicTeam')}</h4>
                <ul className="text-wow-light/80 space-y-2">
                  <li className="flex items-center">
                    <span className="w-3 h-3 bg-mage rounded-full mr-2"></span>
                    <span>{t('about.allClassesConsidered')}</span>
                  </li>
                  <li className="flex items-center ml-5">
                    <span className="w-3 h-3 bg-warlock rounded-full mr-2"></span>
                    <span>Warlocks</span>
                  </li>
                  <li className="flex items-center ml-5">
                    <span className="w-3 h-3 bg-monk rounded-full mr-2"></span>
                    <span>Monks</span>
                  </li>
                  <li className="flex items-center ml-5">
                    <span className="w-3 h-3 bg-priest rounded-full mr-2"></span>
                    <span>Priests</span>
                  </li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h4 className="text-wow-green font-semibold mb-2">{t('about.requirements')}</h4>
                <ul className="text-wow-light/80 space-y-1">
                  <li className="flex items-center">
                    <i className="fas fa-check text-wow-green mr-2"></i>
                    <span>{t('about.norwegianSpeaking')}</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-wow-green mr-2"></i>
                    <span>{t('about.raidAttendance')}</span>
                  </li>
                  <li className="flex items-center">
                    <i className="fas fa-check text-wow-green mr-2"></i>
                    <span>{t('about.positiveAttitude')}</span>
                  </li>
                </ul>
              </div>
              
              <a 
                href="https://discord.gg/X3Wjdh4HvC" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block mt-2 bg-wow-dark text-wow-green font-bold py-2 px-4 rounded-md border-2 border-wow-green hover:bg-wow-green hover:text-wow-dark transition"
              >
                {t('about.applyViaDiscord')}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
