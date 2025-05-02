import { useTranslation } from "react-i18next";

interface FooterProps {
  guildName: string;
  emblemUrl?: string;
}

export default function Footer({ guildName, emblemUrl }: FooterProps) {
  const { t } = useTranslation();
  // Default emblem if none provided
  const defaultEmblem = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  
  return (
    <footer className="bg-wow-dark border-t border-wow-green/30 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <img 
              src={emblemUrl || defaultEmblem} 
              alt={`${guildName} Guild Emblem`} 
              className="w-8 h-8 rounded-full mr-2"
            />
            <span className="font-cinzel text-wow-green text-lg">{guildName}</span>
          </div>
          
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <a 
              href="https://discord.gg/X3Wjdh4HvC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-wow-light hover:text-wow-green transition-colors"
              title={t('social.discord')}
            >
              <i className="fab fa-discord"></i>
            </a>
            <a 
              href="https://twitter.com/guild" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-wow-light hover:text-wow-green transition-colors"
              title={t('social.twitter')}
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a 
              href="https://twitch.tv/guild" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-wow-light hover:text-wow-green transition-colors"
              title={t('social.twitch')}
            >
              <i className="fab fa-twitch"></i>
            </a>
            <a 
              href="https://youtube.com/guild" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-wow-light hover:text-wow-green transition-colors"
              title={t('social.youtube')}
            >
              <i className="fab fa-youtube"></i>
            </a>
          </div>
          
          <div className="text-wow-light/60 text-sm text-center md:text-right">
            <p>{t('footer.copyright')}</p>
            <p>{t('footer.disclaimer')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
