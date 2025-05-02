import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/auth-context';
import { SidebarDrawer } from './ui/sidebar-drawer';
import { UniversalLoginButton } from './universal-login-button';
import { Separator } from './ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WowAvatar } from './wow-avatar';
import BattleNetDiagnostic from './diagnostic/BattleNetDiagnostic';
import BattleNetCharacters from './diagnostic/BattleNetCharacters';
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

export function LoginSidebar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  
  // Get user's Battle.net characters
  const { 
    data: charactersData, 
    isLoading: isLoadingCharacters, 
    refetch: refetchCharacters,
    isRefetching: isRefetchingCharacters,
  } = useQuery({
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
      // Force refetch characters from API
      await refetchCharacters();
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
        openEventName="show-login-sidebar"
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
                    t('profile.guild_member', 'Guild Member')
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
                
                {/* Characters Tab */}
                <TabsContent value="characters" className="p-0 m-0">
                  <div className="py-4 px-4 border-b border-[#061428]">
                    <div className="flex items-center justify-between">
                      <h3 className="uppercase text-base text-white font-medium">
                        <span className="text-[#7EB3FF] mr-1">YOUR</span> CHARACTERS
                      </h3>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-2 text-xs text-[#89C4FF] rounded flex items-center gap-1"
                        onClick={handleRefreshCharacters}
                        disabled={isManualRefetching || isRefetchingCharacters}
                      >
                        {isManualRefetching || isRefetchingCharacters ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCcw className="h-3 w-3 mr-1" />
                        )}
                        {isManualRefetching || isRefetchingCharacters
                          ? t('profile.refreshing', 'Refreshing...')
                          : t('profile.refresh', 'Refresh')}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="p-0 flex-1 bg-[#0F244A] min-h-[300px]">
                    {charactersData && charactersData.data && charactersData.data.characters && charactersData.data.characters.length > 0 ? (
                      <div className="space-y-0 w-full">
                        {charactersData.data.characters.map((character: any) => (
                          <div 
                            key={character.id}
                            className="py-3 px-4 flex items-center hover:bg-[#0A1936] transition-all duration-200 relative w-full border-b border-[#061428]"
                          >
                            {/* Avatar */}
                            <div className="flex-shrink-0">
                              <WowAvatar 
                                name={character.name}
                                className={character.class}
                                realm={character.realm}
                                spec={character.spec}
                                size="sm"
                              />
                            </div>
                            
                            {/* Character info */}
                            <div className="ml-3 min-w-0 flex-1">
                              <p className={cn(`font-medium truncate`, 
                                character.class && typeof character.class === 'string' ? 
                                `text-wow-${character.class.toLowerCase().replace(' ', '-')}` : 
                                'text-white')}>
                                {character.name}
                              </p>
                              <p className="text-xs text-[#89C4FF]/70 truncate">
                                {character.level} {character.spec} {character.class}
                              </p>
                            </div>
                            
                            {/* Item level */}
                            <div className="ml-2 flex-shrink-0 text-right w-14">
                              <p className="text-[#89C4FF] font-medium text-sm">{character.itemLevel ? character.itemLevel : '—'}</p>
                              <p className="text-xs text-[#89C4FF]/50 truncate">{t('profile.item_level', 'Item Level')}</p>
                            </div>
                            
                            {/* Set main button */}
                            {!character.isMain && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity z-10">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="h-7 w-7 p-0 flex items-center justify-center text-xs text-[#89C4FF] bg-[#0A1428]/90 hover:bg-[#1A3A68] transition-all duration-300 rounded-full"
                                  title={t('profile.set_as_main', 'Set as Main Character')}
                                  onClick={async (e) => {
                                    // Prevent setting multiple characters as main simultaneously
                                    const button = e.currentTarget;
                                    if (button.disabled) return;
                                    
                                    // Set local loading state
                                    button.disabled = true;
                                    const originalContent = button.innerHTML;
                                    button.innerHTML = `<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>`;
                                    
                                    try {
                                      // Call API to set this character as main
                                      const response = await fetch('/api/characters/main', {
                                        method: 'POST',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ characterId: character.id }),
                                      });
                                      
                                      const data = await response.json();
                                      
                                      if (data.success) {
                                        // Show success toast
                                        toast({
                                          title: t('profile.main_character_set', 'Main Character Set'),
                                          description: t('profile.main_character_set_description', '{{name}} is now your main character', {
                                            name: character.name
                                          }),
                                        });
                                        
                                        // Refetch character data to update UI
                                        refetchCharacters();
                                      } else {
                                        throw new Error(data.message || 'Failed to set main character');
                                      }
                                    } catch (error) {
                                      console.error('Error setting main character:', error);
                                      toast({
                                        title: t('profile.error', 'Error'),
                                        description: error instanceof Error ? error.message : String(error),
                                        variant: 'destructive',
                                      });
                                      
                                      // Reset button to original state on error
                                      button.disabled = false;
                                      button.innerHTML = originalContent;
                                    }
                                  }}
                                >
                                  <Award className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                            
                            {/* Main character indicator */}
                            {character.isMain && (
                              <div className="ml-2 flex-shrink-0">
                                <div className="bg-[#1A3A68] text-[#89C4FF] px-1.5 py-0.5 rounded text-[10px] font-bold">
                                  MAIN
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-8 h-[300px]">
                        <div className="mb-6 rounded-full h-16 w-16 flex items-center justify-center bg-[#0A1936] border border-[#1A3A68]/50">
                          <Award className="h-8 w-8 text-[#3B6CB0]/60" />
                        </div>
                        <p className="text-white text-base font-medium mb-1">{t('profile.no_characters', 'No characters found')}</p>
                        <p className="text-[#89C4FF]/70 text-sm max-w-md mb-4">{t('profile.characters_note', 'Connect your Battle.net account to see your characters')}</p>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-[#1A3A68] text-[#89C4FF] bg-[#0A1936]/80 hover:bg-[#1A3A68]/70"
                          onClick={handleRefreshCharacters}
                          disabled={isManualRefetching || isRefetchingCharacters}
                        >
                          {isManualRefetching || isRefetchingCharacters ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              <span>{t('profile.refreshing_characters', 'Refreshing...')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <RefreshCcw className="h-4 w-4 mr-2" />
                              <span>{t('profile.refresh_characters', 'Refresh Characters')}</span>
                            </div>
                          )}
                        </Button>
                      </div>
                    )}
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
                {t('login.title', 'Login with Battle.net')}
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