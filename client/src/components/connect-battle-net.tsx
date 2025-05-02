import React, { useState } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';

/**
 * Component for connecting a Battle.net account to an existing user account
 */
export function ConnectBattleNet() {
  const { t } = useTranslation();
  const { user, connectBattleNet } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if user already has a connected Battle.net account
  const hasBattleNetAccount = !!user?.battleNetId && !!user?.battleTag;
  
  // Handle the Battle.net connection process
  const handleConnectBattleNet = async () => {
    try {
      setIsLoading(true);
      
      // Generate state for the OAuth flow
      const state = `connect_${Date.now()}`;
      
      // Store state in local storage to verify when we return
      localStorage.setItem('bnet_connect_state', state);
      
      // Get the redirect URI based on environment
      const isProduction = window.location.hostname.includes('guttakrutt.org');
      const redirectPath = isProduction ? '/auth-callback.php' : '/api/auth/bnet/callback';
      
      // Get battle.net auth URL
      const response = await axios.get('/api/auth/bnet-config');
      
      if (!response.data || !response.data.blizzardClientIdSet) {
        toast({
          title: t('error.title'),
          description: t('error.battleNetConfigMissing'),
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }
      
      // Construct the Battle.net OAuth URL
      const clientId = response.data.blizzardClientIdSet ? 'CLIENT_ID_SET' : 'NO_CLIENT_ID';
      const redirectUri = encodeURIComponent(
        isProduction 
          ? `https://guttakrutt.org/auth-callback.php` 
          : `${window.location.origin}/api/auth/bnet/callback`
      );
      const scope = 'wow.profile';
      const region = response.data.region || 'eu';
      
      // Add custom parameters to track that this is a connection request rather than a login
      localStorage.setItem('bnet_connect_request', 'true');
      
      // Redirect to Battle.net authorization page
      const authUrl = `https://${region}.battle.net/oauth/authorize?response_type=code&client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}&connect=true`;
      
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Battle.net connection:', error);
      setIsLoading(false);
      
      toast({
        title: t('error.title'),
        description: t('error.battleNetConnectionFailed'),
        variant: 'destructive'
      });
    }
  };
  
  // Handle callback from Battle.net OAuth
  React.useEffect(() => {
    // Check if this is a callback from Battle.net with connection request
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('bnet_connect_state');
    const isConnectRequest = localStorage.getItem('bnet_connect_request') === 'true';
    
    if (code && state && storedState && state === storedState && isConnectRequest) {
      // Clear the stored state and connection flag
      localStorage.removeItem('bnet_connect_state');
      localStorage.removeItem('bnet_connect_request');
      
      // Process the OAuth callback for account connection
      const processOAuthCallback = async () => {
        try {
          setIsLoading(true);
          
          // Exchange code for tokens
          const tokenResponse = await axios.post('/api/auth/bnet/token', { 
            code,
            state
          });
          
          if (tokenResponse.data && tokenResponse.data.success) {
            const { accessToken, refreshToken, tokenExpiry, battleNetId, battleTag } = tokenResponse.data;
            
            // Connect the Battle.net account using our new function
            const success = await connectBattleNet({
              battleNetId,
              battleTag,
              accessToken, 
              refreshToken,
              tokenExpiry
            });
            
            if (!success) {
              toast({
                title: t('error.title'),
                description: t('error.battleNetConnectionFailed'),
                variant: 'destructive'
              });
            }
          } else {
            toast({
              title: t('error.title'),
              description: tokenResponse.data?.message || t('error.battleNetConnectionFailed'),
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error connecting Battle.net account:', error);
          toast({
            title: t('error.title'),
            description: t('error.battleNetConnectionFailed'),
            variant: 'destructive'
          });
        } finally {
          setIsLoading(false);
          
          // Clean up the URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      };
      
      processOAuthCallback();
    }
  }, []);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{t('profile.connectBattleNet.title')}</CardTitle>
        <CardDescription>
          {hasBattleNetAccount 
            ? t('profile.connectBattleNet.alreadyConnected', { battleTag: user?.battleTag })
            : t('profile.connectBattleNet.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasBattleNetAccount ? (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <span className="text-sm">{t('profile.connectBattleNet.accountConnected')}</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('profile.connectBattleNet.benefits')}
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {!hasBattleNetAccount && (
          <Button 
            onClick={handleConnectBattleNet}
            disabled={isLoading || !user}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('profile.connectBattleNet.button')
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}