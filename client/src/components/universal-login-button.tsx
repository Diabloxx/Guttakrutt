import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * A universal login button that works in both development and production environments
 */
export function UniversalLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();
  
  const handleLogin = () => {
    setIsLoading(true);
    console.log('Initiating Battle.net login...');
    
    // Determine if we're on the actual guttakrutt.org domain
    const isGuttakruttDomain = window.location.hostname === 'guttakrutt.org' || 
                              window.location.hostname === 'www.guttakrutt.org';
    
    let loginPath;
    
    if (isGuttakruttDomain) {
      // On guttakrutt.org use the PHP endpoint
      loginPath = '/auth-bnet.php';
    } else {
      // In development/Replit environment use the API endpoint
      loginPath = '/api/auth/login';
    }
    
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    const url = `${loginPath}?t=${timestamp}`;
    
    console.log(`Redirecting to ${url}`);
    window.location.href = url;
  };
  
  return (
    <div className="w-full">
      <Button 
        onClick={handleLogin}
        disabled={isLoading}
        variant="default"
        className="w-full text-center flex items-center justify-center bg-blue-700 hover:bg-blue-600 py-5 text-white font-semibold shadow-md"
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 flex-shrink-0" />
            <span>{t('misc.loading', 'Loading...')}</span>
          </span>
        ) : (
          <span className="flex items-center justify-center">
            <LogIn className="w-4 h-4 mr-2 flex-shrink-0" />
            <span>{t('header.login_with_battle_net', 'Login with Battle.net')}</span>
          </span>
        )}
      </Button>
    </div>
  );
}