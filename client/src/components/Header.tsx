import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import LanguageSwitcher from "./LanguageSwitcher";
import guildLogo from "../assets/guild-logo.png";
import { Button } from "@/components/ui/button";
import { User, LogIn } from "lucide-react";

interface UserData {
  id: number;
  battleNetId: string;
  battleTag: string;
  accessToken?: string;
  email?: string;
  lastLogin?: string;
  createdAt: string;
  isGuildMember?: boolean;
  isOfficer?: boolean;
  region?: string;
  locale?: string;
  avatarUrl?: string;
}

interface AuthResponse {
  authenticated: boolean;
  user: UserData | null;
}

interface HeaderProps {
  guildName: string;
  emblemUrl?: string;
}

export default function Header({ guildName, emblemUrl }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t } = useTranslation();
  
  // Check if user is authenticated
  const { data: authData, isLoading: authLoading } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/user'],
    retry: false,
    refetchOnWindowFocus: true,
  });

  // Check if a path is active (for styling active links)
  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="bg-wow-dark border-b border-wow-green/30">
      <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="relative">
            <img 
              src={guildLogo} 
              alt={`${guildName} Guild Logo`} 
              className="h-16 md:h-20 max-w-none object-contain"
              style={{ filter: 'drop-shadow(0 0 4px rgba(171, 244, 0, 0.4))' }}
            />
          </div>
          <h1 className="font-cinzel text-wow-green text-2xl font-bold sr-only">{guildName}</h1>
        </div>
        
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          
          {/* Mobile Authentication Button - Always visible */}
          {!authLoading && (
            <Button 
              variant="ghost" 
              className="text-wow-light hover:text-wow-green border border-wow-green/30 hover:bg-wow-green/10 p-1.5"
              size="sm"
              onClick={() => {
                console.log('Mobile login/profile button clicked, dispatching event');
                const event = new CustomEvent('open-login-sidebar');
                window.dispatchEvent(event);
              }}
            >
              {authData?.authenticated ? (
                <User className="h-5 w-5" />
              ) : (
                <LogIn className="h-5 w-5" />
              )}
            </Button>
          )}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-wow-light hover:text-wow-green p-2 border border-wow-green/30 rounded-md"
            aria-label="Toggle menu"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              className="w-6 h-6"
            >
              {isMenuOpen ? (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              ) : (
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 6h16M4 12h16M4 18h16" 
                />
              )}
            </svg>
          </button>
        </div>
        
        <div className="flex md:items-center">
          <nav className={`${isMenuOpen ? 'block w-full absolute left-0 right-0 top-[72px] bg-wow-dark border-b border-wow-green/30 z-50 py-2 shadow-lg' : 'hidden'} md:relative md:block md:top-0 md:border-0 md:shadow-none md:py-0 md:bg-transparent`}>
            <ul className="flex flex-col md:flex-row space-y-2 md:space-y-0 space-x-0 md:space-x-4 px-4 md:px-0">
              <li className="group">
                <Link 
                  href="/" 
                  className={`flex items-center px-3 py-3 md:py-2 ${
                    isActive('/') ? 'text-wow-green' : 'text-wow-light'
                  } hover:text-wow-green transition-colors ${isActive('/') ? 'border-l-4 border-wow-green md:border-0 pl-2 md:pl-3' : ''}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <i className="fa fa-home mr-2"></i>
                  <span>{t('header.home')}</span>
                </Link>
              </li>
              <li className="group">
                <Link 
                  href="#roster" 
                  className={`flex items-center px-3 py-3 md:py-2 ${
                    isActive('#roster') ? 'text-wow-green' : 'text-wow-light'
                  } hover:text-wow-green transition-colors ${isActive('#roster') ? 'border-l-4 border-wow-green md:border-0 pl-2 md:pl-3' : ''}`}
                  onClick={() => {
                    setIsMenuOpen(false);
                    const element = document.getElementById('roster');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <i className="fa fa-users mr-2"></i>
                  <span>{t('guild.roster')}</span>
                </Link>
              </li>
              <li className="group">
                <Link 
                  href="#progress" 
                  className={`flex items-center px-3 py-3 md:py-2 ${
                    isActive('#progress') ? 'text-wow-green' : 'text-wow-light'
                  } hover:text-wow-green transition-colors ${isActive('#progress') ? 'border-l-4 border-wow-green md:border-0 pl-2 md:pl-3' : ''}`}
                  onClick={() => {
                    setIsMenuOpen(false);
                    const element = document.getElementById('progress');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <i className="fa fa-trophy mr-2"></i>
                  <span>{t('guild.raidProgress')}</span>
                </Link>
              </li>
              <li className="group">
                <Link 
                  href="#about" 
                  className={`flex items-center px-3 py-3 md:py-2 ${
                    isActive('#about') ? 'text-wow-green' : 'text-wow-light'
                  } hover:text-wow-green transition-colors ${isActive('#about') ? 'border-l-4 border-wow-green md:border-0 pl-2 md:pl-3' : ''}`}
                  onClick={() => {
                    setIsMenuOpen(false);
                    const element = document.getElementById('about');
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  <i className="fa fa-info-circle mr-2"></i>
                  <span>{t('guild.about')}</span>
                </Link>
              </li>
            </ul>
          </nav>
          
          {/* Language switcher and auth for desktop */}
          <div className="hidden md:flex items-center ml-4 gap-3">
            <LanguageSwitcher />
            
            {/* Authentication */}
            {authLoading ? (
              <div className="w-6 h-6 rounded-full border-2 border-wow-green/30 border-t-transparent animate-spin"></div>
            ) : authData?.authenticated ? (
              <Button 
                variant="ghost" 
                className="text-wow-light hover:text-wow-green border border-wow-green/30 hover:bg-wow-green/10"
                size="sm"
                onClick={() => {
                  console.log('Profile button clicked in header, dispatching event');
                  // Create and dispatch a custom event to open the sidebar
                  const event = new CustomEvent('open-login-sidebar');
                  window.dispatchEvent(event);
                }}
              >
                <User className="h-4 w-4 mr-2" />
                {t('header.profile')}
              </Button>
            ) : (
              // Just trigger the login sidebar via event
              <Button 
                variant="ghost" 
                className="text-wow-light hover:text-wow-green border border-wow-green/30 hover:bg-wow-green/10"
                size="sm"
                onClick={() => {
                  console.log('Login button clicked in header, dispatching event');
                  // Create and dispatch a custom event to open the sidebar
                  const event = new CustomEvent('open-login-sidebar');
                  window.dispatchEvent(event);
                }}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {t('header.login_with_battle_net')}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile authentication menu */}
      {isMenuOpen && (
        <div className="md:hidden px-4 py-2 bg-wow-dark border-t border-wow-green/30">
          {/* Auth Buttons */}
          {authLoading ? (
            <div className="w-6 h-6 mx-auto my-2 rounded-full border-2 border-wow-green/30 border-t-transparent animate-spin"></div>
          ) : authData?.authenticated ? (
            <Button 
              variant="ghost" 
              className="w-full text-wow-light hover:text-wow-green border border-wow-green/30 hover:bg-wow-green/10"
              onClick={() => {
                console.log('Mobile profile button clicked, dispatching event');
                // Create and dispatch a custom event to open the sidebar
                const event = new CustomEvent('open-login-sidebar');
                window.dispatchEvent(event);
                // Close mobile menu
                setIsMenuOpen(false);
              }}
            >
              <User className="h-4 w-4 mr-2" />
              {t('header.profile')}
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full text-wow-light hover:text-wow-green border border-wow-green/30 hover:bg-wow-green/10"
              onClick={() => {
                console.log('Mobile login button clicked, dispatching event');
                // Create and dispatch a custom event to open the sidebar
                const event = new CustomEvent('open-login-sidebar');
                window.dispatchEvent(event);
                // Close mobile menu
                setIsMenuOpen(false);
              }}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {t('header.login_with_battle_net')}
            </Button>
          )}
        </div>
      )}
    </header>
  );
}
