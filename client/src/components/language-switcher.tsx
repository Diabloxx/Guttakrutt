import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'text' | 'button' | 'minimal';
}

/**
 * Language switcher component
 * Supports multiple styles (text links, buttons, or minimal icons)
 */
export default function LanguageSwitcher({ 
  className,
  variant = 'minimal' 
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  
  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'no' : 'en';
    i18n.changeLanguage(newLanguage);
    // Save language preference to localStorage
    localStorage.setItem('language', newLanguage);
  };
  
  // Language names in their native form
  const languageNames = {
    en: 'English',
    no: 'Norsk'
  };
  
  // Flags for language indicators
  const languageFlags = {
    en: '🇬🇧',
    no: '🇳🇴'
  };
  
  // Next language to switch to
  const nextLanguage = currentLanguage === 'en' ? 'no' : 'en';
  
  if (variant === 'text') {
    return (
      <div className={cn("flex items-center space-x-3 text-sm", className)}>
        <button 
          onClick={toggleLanguage}
          className={cn(
            "flex items-center space-x-1 hover:underline transition-colors",
            currentLanguage === 'en' ? 'text-wow-gold' : 'text-wow-light/70 hover:text-wow-light'
          )}
          aria-label="Switch to English"
        >
          <span>{languageFlags.en}</span>
          <span>English</span>
        </button>
        
        <div className="text-wow-light/40">|</div>
        
        <button 
          onClick={toggleLanguage}
          className={cn(
            "flex items-center space-x-1 hover:underline transition-colors",
            currentLanguage === 'no' ? 'text-wow-gold' : 'text-wow-light/70 hover:text-wow-light'
          )}
          aria-label="Switch to Norwegian"
        >
          <span>{languageFlags.no}</span>
          <span>Norsk</span>
        </button>
      </div>
    );
  }
  
  if (variant === 'button') {
    return (
      <Button
        onClick={toggleLanguage}
        variant="wow-alt"
        size="sm"
        className={cn("text-xs", className)}
      >
        {languageFlags[nextLanguage]} {languageNames[nextLanguage]}
      </Button>
    );
  }
  
  // Minimal variant - just the flag with the current language
  return (
    <button
      onClick={toggleLanguage}
      className={cn(
        "flex items-center justify-center p-1 rounded-full hover:bg-wow-dark/80 transition-colors",
        className
      )}
      aria-label={`Switch to ${languageNames[nextLanguage]}`}
    >
      <span className="text-lg">{languageFlags[currentLanguage]}</span>
    </button>
  );
}