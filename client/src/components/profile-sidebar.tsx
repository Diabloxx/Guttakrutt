import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { SidebarDrawer } from '@/components/ui/sidebar-drawer';
import { UniversalLoginButton } from '@/components/universal-login-button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WowAvatar } from '@/components/ui/wow-avatar';
import BattleNetDiagnostic from '@/components/diagnostic/BattleNetDiagnostic';
import BattleNetCharacters from '@/components/diagnostic/BattleNetCharacters';
import { useQuery } from '@tanstack/react-query';

// Icons
import { 
  AlertCircle, 
  Award, 
  LogOut, 
  Loader2, 
  RefreshCcw, 
  Settings, 
  Shield, 
  Sword, 
  UserCircle2 
} from 'lucide-react';

// This is the sidebar component that exactly matches the screenshots
export function ProfileSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Get user's Battle.net characters
  const { 
    data: charactersData, 
    isLoading: isLoadingCharacters, 
    refetch: refetchCharacters,
    isRefetching: isRefetchingCharacters,
  } = useQuery<any>({
    queryKey: ['/api/characters'],
    enabled: !!user, // Only run if user is logged in
  });
  
  // Manually track if we're refreshing (prevents UI flickering)
  const [isManualRefetching, setIsManualRefetching] = React.useState(false);

  // Handle refresh button click
  const handleRefreshCharacters = async () => {
    // Don't allow multiple refreshes simultaneously
    if (isManualRefetching || isRefetchingCharacters) return;
    
    setIsManualRefetching(true);
    
    try {
      // First fetch characters from Battle.net - use PHP simulation endpoint for production compatibility
      const response = await fetch('/auth-characters.php/fetch-bnet-characters', {
        method: 'GET',
        credentials: 'include', // Important! Include credentials (cookies) with the request
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Check for different error status codes
      if (response.status === 401) {
        throw new Error(t('profile.auth_error', 'Authentication error. Please try logging out and back in.'));
      }
      
      if (response.status === 403) {
        throw new Error(t('profile.permission_error', 'Your Battle.net account needs additional permissions. Please disconnect your account and reconnect it, ensuring you grant access to your World of Warcraft profile.'));
      }
      
      const result = await response.json();
      
      // Handle API-level errors
      if (!result.success) {
        // Special handling for permission errors that might come through JSON
        if (result.error === 'insufficient_permissions') {
          throw new Error(t('profile.permission_error', 'Your Battle.net account needs additional permissions. Please disconnect your account and reconnect it, ensuring you grant access to your World of Warcraft profile.'));
        }
        
        // Special handling for token expiration
        if (result.error === 'token_expired') {
          throw new Error(t('profile.token_expired', 'Your Battle.net session has expired. Please log out and log in again.'));
        }
        
        // General error
        throw new Error(result.message || t('profile.generic_error', 'Failed to fetch characters from Battle.net'));
      }
      
      // Then refetch the characters from our database
      await refetchCharacters();
      
      // Show success message
      toast({
        title: t('profile.characters_refreshed', 'Characters Refreshed'),
        description: t('profile.characters_refreshed_description', 'Your characters have been refreshed from Battle.net'),
      });
    } catch (error) {
      console.error('Error refreshing characters:', error);
      toast({
        title: t('profile.error', 'Error'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    } finally {
      setIsManualRefetching(false);
    }
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await logout();
      
      toast({
        title: t('profile.logged_out', 'Logged Out'),
        description: t('profile.logged_out_description', 'You have been successfully logged out'),
      });
    } catch (error) {
      console.error('Error logging out:', error);
      toast({
        title: t('profile.error', 'Error'),
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <SidebarDrawer 
        width="normal"
        openEventName="open-login-sidebar"
        closeOnClickOutside={true}
      >
        {user ? (
          // LOGGED-IN STATE: Show profile
          <div className="h-full flex flex-col bg-[#0A1428]">
            {/* Profile header - exactly matches screenshot */}
            <div className="py-4 px-6 flex items-center bg-[#0F1A2A] border-b border-[#061428]">
              <div className="w-14 h-14 mr-4">
                <div className="w-full h-full rounded-full bg-[#0C2B21] border-2 border-[#00FF73] flex items-center justify-center">
                  <span className="text-[#00FF73] text-2xl font-semibold">
                    {user?.username?.[0]?.toUpperCase() || user?.battleTag?.[0]?.toUpperCase() || 'V'}
                  </span>
                </div>
              </div>
              
              <div>
                <h2 className="text-white text-xl font-semibold">
                  {user.battleTag?.split('#')[0] || user.username || 'VALLERIAA'}
                </h2>
                <p className="text-[#00FF73] text-sm flex items-center">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00FF73] mr-1.5"></span>
                  {user.isOfficer ? 
                    t('profile.guild_officer', 'Guild Officer') : 
                    user.isGuildMember ?
                    t('profile.guild_member', 'Guild Member') :
                    t('profile.battlenet_user', 'Battle.net User')
                  }
                </p>
              </div>
            </div>
            
            {/* Tabs - exactly as shown in the screenshots */}
            <div className="border-b border-[#061428] bg-[#0A1428]">
              <Tabs defaultValue="characters" className="w-full">
                <TabsList className="w-full grid grid-cols-4 bg-transparent p-0 rounded-none h-auto">
                  <TabsTrigger 
                    value="characters" 
                    className="rounded-none py-2.5 px-4 text-[#B1C3E0] data-[state=active]:text-white data-[state=active]:bg-[#11203A] data-[state=active]:border-b-2 data-[state=active]:border-[#1A3A68] border-b-2 border-transparent"
                  >
                    <span className="truncate text-sm">Characters</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings" 
                    className="rounded-none py-2.5 px-4 text-[#B1C3E0] data-[state=active]:text-white data-[state=active]:bg-[#11203A] data-[state=active]:border-b-2 data-[state=active]:border-[#1A3A68] border-b-2 border-transparent"
                  >
                    <span className="truncate text-sm">Settings</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="account" 
                    className="rounded-none py-2.5 px-4 text-[#B1C3E0] data-[state=active]:text-white data-[state=active]:bg-[#11203A] data-[state=active]:border-b-2 data-[state=active]:border-[#1A3A68] border-b-2 border-transparent"
                  >
                    <span className="truncate text-sm">Account</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="diagnostics" 
                    className="rounded-none py-2.5 px-4 text-[#B1C3E0] data-[state=active]:text-white data-[state=active]:bg-[#11203A] data-[state=active]:border-b-2 data-[state=active]:border-[#1A3A68] border-b-2 border-transparent"
                  >
                    <span className="truncate text-sm flex items-center">
                      <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate hidden sm:inline">Diagnostics</span>
                    </span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Characters Tab - Using BattleNetCharacters component */}
                <TabsContent value="characters" className="p-0 m-0">
                  <div className="py-4 px-4 border-b border-[#061428]">
                    <div className="flex items-center justify-between">
                      <h3 className="uppercase text-base text-white font-medium">
                        <span className="text-[#7EB3FF] mr-1">YOUR</span> CHARACTERS
                      </h3>
                    </div>
                  </div>
                  
                  <div className="p-4 flex-1 bg-[#0F244A] min-h-[300px]">
                    <BattleNetCharacters />
                  </div>
                </TabsContent>
                
                {/* Settings Tab */}
                <TabsContent value="settings" className="p-0 m-0">
                  <div className="py-4 px-4 border-b border-[#061428]">
                    <h3 className="uppercase text-base text-white font-medium">SETTINGS</h3>
                  </div>
                  
                  <div className="p-0 flex-1 flex flex-col bg-[#11203A]">
                    <div className="p-4 border-b border-[#061428]">
                      <h4 className="text-sm text-white font-medium mb-2">Site Theme</h4>
                      <select className="w-full bg-[#0A1428] border border-[#1A3A68] rounded p-2 text-[#89C4FF]">
                        <option value="dark">Dark Theme</option>
                      </select>
                    </div>
                    
                    <div className="p-4 border-b border-[#061428]">
                      <h4 className="text-sm text-white font-medium mb-2">Notifications</h4>
                      <div className="flex items-center justify-between w-full">
                        <span className="text-[#89C4FF]">Discord Notifications</span>
                        <div className="relative h-5 w-10">
                          <div className="h-5 w-10 rounded-full bg-[#1A3A68] p-0.5 flex items-center">
                            <div className="h-4 w-4 rounded-full bg-[#89C4FF] translate-x-0"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 border-b border-[#061428]">
                      <h4 className="text-sm text-white font-medium mb-2">Language</h4>
                      <select className="w-full bg-[#0A1428] border border-[#1A3A68] rounded p-2 text-[#89C4FF]">
                        <option value="en">English</option>
                        <option value="no">Norsk</option>
                      </select>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Account Tab */}
                <TabsContent value="account" className="p-0 m-0">
                  <div className="py-4 px-4 border-b border-[#061428]">
                    <h3 className="uppercase text-base text-white font-medium">ACCOUNT</h3>
                  </div>
                  
                  <div className="p-0 flex-1 flex flex-col bg-[#11203A]">
                    <div className="p-4 border-b border-[#061428] flex justify-between items-center">
                      <span className="text-[#89C4FF]">Battle Tag</span>
                      <span className="text-white font-medium">{user.battleTag || 'Valleriaa#2373'}</span>
                    </div>
                    
                    <div className="p-4 border-b border-[#061428] flex justify-between items-center">
                      <span className="text-[#89C4FF]">Registered</span>
                      <span className="text-white">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '30.4.2025'}</span>
                    </div>
                    
                    <div className="p-4 border-b border-[#061428] flex justify-between items-center">
                      <span className="text-[#89C4FF]">Last Login</span>
                      <span className="text-white">{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : '30.4.2025'}</span>
                    </div>
                    
                    {user.isOfficer && (
                      <div className="p-4 border-b border-[#061428] flex justify-between items-center">
                        <span className="text-[#89C4FF]">Officer Access</span>
                        <span className="text-[#00FF73] flex items-center">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00FF73] mr-1.5"></span>
                          Enabled
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-auto p-4">
                      <Button 
                        variant="outline" 
                        className="w-full border-[#1A3A68] bg-[#0A1428] text-[#89C4FF] hover:bg-[#1A3A68]/70 flex items-center justify-center"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </Button>
                      
                      {user.isOfficer && (
                        <Link href="/admin-dashboard" className="w-full block mt-2">
                          <Button 
                            variant="default" 
                            className="w-full bg-[#1C4ED8] hover:bg-[#1C4ED8]/80 text-white flex items-center justify-center"
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Dashboard
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Diagnostics Tab */}
                <TabsContent value="diagnostics" className="p-0 m-0">
                  <div className="py-4 px-4 border-b border-[#061428]">
                    <h3 className="uppercase text-base text-white font-medium">DIAGNOSTICS</h3>
                  </div>
                  
                  <div className="p-0 flex-1 bg-[#11203A] overflow-auto">
                    <div className="p-4 border-b border-[#061428]">
                      <h4 className="text-sm text-white font-medium mb-2">Battle.net Character Data</h4>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-[#1A3A68] text-[#89C4FF] bg-[#0A1428] hover:bg-[#1A3A68]/70"
                      >
                        <RefreshCcw className="h-3.5 w-3.5 mr-1" />
                        Refresh
                      </Button>
                    </div>
                    
                    <div className="p-4">
                      <BattleNetCharacters />
                      <BattleNetDiagnostic />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        ) : (
          // NOT LOGGED IN STATE: Show login options
          <div className="flex flex-col p-6 h-full w-full bg-[#0A1428]">
            <div className="mb-6 p-4 bg-[#11203A] border border-[#1A3A68]/50 rounded-lg shadow-lg w-full">
              <h2 className="text-xl font-bold text-white text-center mb-3">
                {t('header.login_with_battle_net', 'Login with Battle.net')}
              </h2>
              <p className="text-[#89C4FF] text-sm text-center mb-4">
                {t('login.description', 'Login with your Battle.net account to access your character profiles and guild member features.')}
              </p>
              
              <div className="w-full">
                <UniversalLoginButton />
              </div>
            </div>
            
            <div className="relative my-6 w-full">
              <hr className="border-[#1A3A68]" />
              <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-[#0A1428] text-[#89C4FF] text-xs font-semibold">
                {t('common.or', 'OR')}
              </span>
            </div>
            
            <Link href="https://discord.gg/X3Wjdh4HvC" target="_blank" className="w-full">
              <Button 
                variant="outline" 
                className="w-full border-indigo-600/30 text-indigo-400 bg-indigo-950/20 hover:bg-indigo-900/30 mb-4"
              >
                <svg className="h-4 w-4 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>{t('login.join_discord', 'Join Discord Server')}</span>
              </Button>
            </Link>
            
            <Link href="/apply" className="mx-auto mt-4 text-[#00FF73] hover:underline text-sm">
              {t('login.apply_to_guild', 'Apply to join the guild')}
            </Link>
          </div>
        )}
      </SidebarDrawer>
    </>
  );
}