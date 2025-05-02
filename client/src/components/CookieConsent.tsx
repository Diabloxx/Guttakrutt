import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

const CookieConsent: React.FC = () => {
  const [showConsent, setShowConsent] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Check if user already accepted cookies
    const hasAcceptedCookies = localStorage.getItem('cookie-consent');
    if (!hasAcceptedCookies) {
      // If not, show the cookie consent banner
      setShowConsent(true);
    }
  }, []);

  const handleAccept = () => {
    // Store consent in localStorage
    localStorage.setItem('cookie-consent', 'accepted');
    setShowConsent(false);
  };

  if (!showConsent) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black/90 text-white p-4 z-50 border-t border-green-600">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="flex-1 mb-4 md:mb-0">
          <h3 className="text-lg font-semibold mb-1">{t('cookie.title', 'Cookie Notice')}</h3>
          <p className="text-sm text-gray-300">
            {t(
              'cookie.message',
              'This website uses cookies to enhance your browsing experience, analyze site traffic and personalize content. By clicking "Accept", you consent to our use of cookies.'
            )}
          </p>
        </div>
        <div className="flex items-center">
          <Button 
            onClick={handleAccept} 
            className="bg-green-600 hover:bg-green-700 text-white ml-4"
          >
            {t('cookie.accept', 'Accept')}
          </Button>
          <button 
            onClick={handleAccept}
            className="ml-2 text-gray-400 hover:text-white p-1"
            aria-label="Close cookie notice"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;