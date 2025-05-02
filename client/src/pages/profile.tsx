import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'wouter';
import { 
  Shield, 
  User, 
  CalendarDays, 
  Globe2, 
  LogOut, 
  Check, 
  Clock, 
  ExternalLink,
  AlertCircle,
  RotateCcw,
  Trash2
} from 'lucide-react';
import { apiRequest, getProperEndpoint, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { CharacterList } from '@/components/character-list';
// Fixing import to use the default export properly
import BattleNetDiagnostic from '@/components/diagnostic/BattleNetDiagnostic';

interface UserData {
  id: number;
  battleNetId?: string;
  battleTag?: string;
  username?: string;
  displayName?: string;
  accessToken?: string;
  email?: string;
  lastLogin?: string;
  createdAt: string;
  isGuildMember?: boolean;
  isOfficer?: boolean;
  region?: string;
  locale?: string;
  avatarUrl?: string;
  password?: string; // Hashed password, never displayed
}

interface UserCharacter {
  id: number;
  name: string;
  class: string;
  className?: string; // Support for old format
  specName?: string;
  level: number;
  itemLevel?: number;
  isMain: boolean;
  verified: boolean;
  avatarUrl?: string;
  armoryLink?: string;
  guild?: string;
  realm?: string;
  faction?: string;
  race?: string;
}

interface AuthResponse {
  authenticated: boolean;
  user: UserData | null;
  debug?: {
    source?: string;
    method?: string;
    error?: string;
    [key: string]: any;
  };
}

interface CharactersResponse {
  success: boolean;
  data?: {
    characters: UserCharacter[];
  };
  characters?: UserCharacter[];
  count?: number;
  debug?: {
    source?: string;
    error?: string;
    [key: string]: any;
  };
}

export default function ProfilePage() {
  // === ALL REACT HOOKS MUST BE CALLED UNCONDITIONALLY AT THE TOP LEVEL ===
  const { t } = useTranslation();
  const { toast } = useToast();
  
  // State for direct data loading (for Windows environments)
  const [directUser, setDirectUser] = React.useState<UserData | null>(null);
  const [directCharacters, setDirectCharacters] = React.useState<UserCharacter[]>([]);
  const [isLoadingDirectData, setIsLoadingDirectData] = React.useState(false);
  const [loadedDirectData, setLoadedDirectData] = React.useState(false);
  const [directDataError, setDirectDataError] = React.useState<string | null>(null);
  
  // Add an extra check to prevent repeated auth attempts
  const attemptCount = React.useRef(0);
  
  // Fetch user data if authenticated - now using automatic URL conversion in queryClient
  const { data: authData, isLoading: authLoading, error: authError } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/user'],
    retry: false,
  });
  
  // Fetch user characters - ensure this hook runs on EVERY render even if the user isn't authenticated yet
  // We use the enabled flag to prevent the actual network request when not authenticated
  const { data: characterData, isLoading: charactersLoading } = useQuery<CharactersResponse>({
    queryKey: ['/api/characters'],
    enabled: !!authData?.authenticated,
  });
  
  // Now that ALL hooks have been called, we can conditionally return based on state
  
  // Show loading state if either query is loading
  if (authLoading || (charactersLoading && authData?.authenticated)) {
    return <Loading />;
  }
  
  // Show error if auth query fails, but with a better error display and retry option
  if (authError) {
    return (
      <div className="container py-10 px-4 mx-auto flex flex-col items-center">
        <div className="w-full max-w-md bg-wow-dark/90 border border-wow-green/20 rounded-lg p-8 text-center shadow-lg">
          <h2 className="text-2xl font-cinzel text-wow-green mb-4">Connection Error</h2>
          <p className="text-wow-light/80 mb-6">
            There was a problem connecting to the authentication service. This could be due to network issues or the server being temporarily unavailable.
          </p>
          <div className="text-red-400 mb-6 p-3 bg-red-900/20 rounded-md border border-red-800/30">
            {authError.message || "Failed to fetch authentication data"}
          </div>
          <Button 
            variant="default" 
            className="bg-wow-green/20 hover:bg-wow-green/30 border border-wow-green/30 text-wow-green"
            onClick={() => {
              // Refresh the page with a timestamp parameter to bypass cache
              window.location.href = `/profile?refresh=${Date.now()}`;
            }}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }
  
  // Check URL parameters for auth_redirect - if present, the user is coming from a successful auth flow
  const urlParams = new URLSearchParams(window.location.search);
  const isAuthRedirect = urlParams.get('auth_redirect') === 'true';
  const urlUserId = urlParams.get('userId');
  const urlBattleTag = urlParams.get('battleTag');
  
  // Also check cookies which might have been set during auth flow
  const authRedirectCookie = document.cookie.includes('auth_redirect=true');
  const authUserIdCookie = document.cookie.match(/auth_user_id=(\d+)/);
  const authBattleTagCookie = document.cookie.match(/auth_battle_tag=([^;]+)/);
  
  // As a fallback, check localStorage which might have been set during auth flow
  const lsAuthUserId = localStorage.getItem('guttakrutt_auth_user_id');
  const lsAuthBattleTag = localStorage.getItem('guttakrutt_auth_battle_tag');
  const lsAuthTimestamp = localStorage.getItem('guttakrutt_auth_timestamp');
  
  // Determine the userId to use for direct auth if needed - prefer URL then cookie then localStorage
  const directUserIdToTry = urlUserId || (authUserIdCookie ? authUserIdCookie[1] : null) || lsAuthUserId;
  
  // Do we have userId and auth_redirect parameter? If so, we can try to manually load user data
  const hasValidUserIdParam = directUserIdToTry && !isNaN(Number(directUserIdToTry));
  
  // Check if we have the auth_redirect cookie or parameter, indicating a successful auth
  // This helps in environments where session might take a bit to initialize
  // Also check for login_success parameter which is set after successful direct login
  const loginSuccess = urlParams.get('login_success') === 'true';
  const authRedirectDetected = isAuthRedirect || authRedirectCookie || loginSuccess || 
                              (lsAuthTimestamp && (Date.now() - Number(lsAuthTimestamp)) < 60000);
  
  if (authRedirectDetected && !authData?.authenticated && attemptCount.current < 1) {
    console.log('Auth redirect detected - user has successfully authenticated');
    console.log('URL parameters:', {
      isAuthRedirect, 
      hasUserId: !!urlUserId,
      validUserId: hasValidUserIdParam
    });
    
    // If we're coming from a redirect but don't have auth data yet, show loading
    // This handles the race condition between auth being set up and page loading
    console.log('Auth redirect flag found but auth data not loaded yet, showing loading state');
    
    // If we have a valid userId in any of our sources, we'll try an explicit refetch after forcing an auth check
    if (hasValidUserIdParam && !authLoading) {
      console.log(`Found userId ${directUserIdToTry} (from URL/cookie/localStorage) - attempting direct refresh`);
      
      // Increment the attempt counter to prevent repeated auth attempts
      attemptCount.current += 1;
      
      // First try the standard refetch
      void queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      void queryClient.refetchQueries({ queryKey: ['/api/auth/user'] });
      
      // Also make a direct authenticated request to the server with the userId
      // This helps in environments where the session might be having issues
      const checkWithUserId = async () => {
        try {
          // Try both the api endpoint and the PHP simulation endpoint for maximum compatibility
          // First try the PHP simulation endpoint which works better for Windows development environments
          const phpApiUrl = '/auth-direct-check.php';
          console.log(`Making direct auth check to PHP endpoint ${phpApiUrl} with userId=${directUserIdToTry}`);
          
          try {
            const phpResponse = await fetch(`${phpApiUrl}?userId=${directUserIdToTry}`);
            
            if (phpResponse.ok) {
              const phpData = await phpResponse.json();
              console.log('PHP direct auth check result:', phpData);
              
              // If the PHP endpoint was successful, use its response and skip the API endpoint
              if (phpData?.data?.success || phpData?.data?.authenticated) {
                console.log('PHP direct auth successful, using this result');
                
                // Show success toast
                try {
                  toast({
                    title: "Authentication successful",
                    description: "Your login has been verified via PHP endpoint. Welcome!",
                    variant: "default",
                  });
                } catch (e) {
                  console.log('Toast notification error:', e);
                }
                
                // Clear auth redirect flags to prevent further attempts
                document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                
                // Force page reload after a brief delay with explicit success flags
                setTimeout(() => {
                  window.location.href = "/profile?login_success=true&t=" + Date.now();
                }, 500);
                
                return phpData?.data;
              } else {
                console.log('PHP direct auth was not successful, trying API endpoint as fallback');
              }
            } else {
              console.log('PHP direct auth check failed, trying API endpoint as fallback');
            }
          } catch (phpError) {
            console.log('Error during PHP direct auth check, trying API endpoint as fallback:', phpError);
          }
          
          // Fallback to regular API endpoint
          const apiUrl = getProperEndpoint('/api/auth/direct-check');
          console.log(`Making direct auth check to API endpoint ${apiUrl} with userId=${directUserIdToTry}`);
          
          const response = await fetch(`${apiUrl}?userId=${directUserIdToTry}`);
          
          if (response.ok) {
            const data = await response.json();
            console.log('Direct auth check result:', data);
            
            // If successful, immediately refetch 
            // Check for both standard API response and PHP simulation response formats
            const isSuccess = data?.success || data?.authenticated || 
                              data?.data?.success || data?.data?.authenticated;
            
            if (isSuccess) {
              console.log('Direct auth successful, refreshing user data');
              
              // Add toast notification for successful login
              try {
                toast({
                  title: "Authentication successful",
                  description: "Your login has been verified via API endpoint. Welcome!",
                  variant: "default",
                });
              } catch (e) {
                // Toast might fail if component is unmounting, just log it
                console.log('Toast notification error:', e);
              }
              
              // Clear auth redirect flags to prevent further attempts
              document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
              
              // Force page reload after a brief delay with explicit success flags
              setTimeout(() => {
                window.location.href = "/profile?login_success=true&t=" + Date.now();
              }, 500);
            } else {
              console.log('Direct auth returned unsuccessful result:', data);
              // Clear the temporary auth cookies/localStorage since this didn't work
              try {
                // Show error toast if available
                toast({
                  title: "Authentication issue",
                  description: "There was a problem with your login. Please try again.",
                  variant: "destructive",
                });
                
                document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "auth_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "auth_battle_tag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                localStorage.removeItem('guttakrutt_auth_timestamp');
                localStorage.removeItem('guttakrutt_auth_user_id');
                localStorage.removeItem('guttakrutt_auth_battle_tag');
              } catch (e) {
                console.error('Error clearing auth data:', e);
              }
            }
          } else {
            console.error('Error during direct auth check - server returned:', response.status, response.statusText);
          }
        } catch (e) {
          console.error('Error during direct auth check:', e);
        }
      };
      
      // Run the check immediately
      checkWithUserId();
    }
    
    return <Loading message="Authentication successful, loading profile data..." />;
  }
  
  // Check for debugging parameter that forces the profile view to display
  const forceProfileView = urlParams.get('force_profile') === 'true';
  
  // Redirect if not authenticated - AFTER all hooks have been called and redirect check
  // Skip this check if we have login_success or force_profile parameters
  if (!authData?.authenticated && !loginSuccess && !forceProfileView) {
    console.log('User not authenticated and no redirect flags found, showing login required');
    return <LoginRequired />;
  }
  
  // If we have login_success but not authenticated yet, try a forced profile display
  // This helps in Windows environments where session state might not be immediately reflected
  const alreadyForced = urlParams.get('force_profile') === 'true';
  const forceCounter = parseInt(urlParams.get('force_count') || '0', 10);
  
  // Prevent infinite loops by only attempting forced display a limited number of times
  if (loginSuccess && !authData?.authenticated && forceCounter < 1) {
    console.log('Login success detected but user not authenticated - forcing profile display');
    const userId = directUserIdToTry || 0;
    const newCount = forceCounter + 1;
    
    // Only redirect if we haven't already forced profile view
    if (!alreadyForced) {
      // Adding a URL parameter to force profile view on next reload
      window.location.href = `/profile?login_success=true&force_profile=true&userId=${userId}&force_count=${newCount}&t=${Date.now()}`;
      return <Loading message="Authentication successful, preparing profile view..." />;
    }
  }
  
  // We've already declared these hooks at the top level of the component
  // They've been moved to comply with React's Rules of Hooks

  // Use a more reliable approach to load direct user data especially for Windows environments
  // This performs sequential checks to several PHP-simulation endpoints to retrieve all necessary data
  React.useEffect(() => {
    let cancelled = false;
    
    async function fetchDirectUserData() {
      if ((alreadyForced || loginSuccess) && !authData?.authenticated && !loadedDirectData && !isLoadingDirectData) {
        setIsLoadingDirectData(true);
        try {
          console.log('Fetching data directly from PHP endpoints...');
          
          // Check if we're on the production domain
          const isProduction = window.location.hostname === 'guttakrutt.org';
          const baseUrl = isProduction ? 'https://guttakrutt.org' : '';
          
          // First, use auth-direct-check.php to verify authentication and get user ID
          let userId = directUserIdToTry;
          
          if (!userId) {
            console.log('No direct userId provided, checking auth status via direct check endpoint');
            const authCheckResponse = await fetch(`${baseUrl}/auth-direct-check.php?t=${Date.now()}`);
            if (authCheckResponse.ok) {
              const checkData = await authCheckResponse.json();
              if (checkData?.data?.authenticated && checkData?.data?.userId) {
                userId = checkData.data.userId;
                console.log(`Direct auth check successful, got user ID: ${userId}`);
              } else {
                console.log('Auth check found no authenticated user');
              }
            }
          }
          
          // If we now have a userId, continue with loading user and characters data
          if (userId && !cancelled) {
            console.log(`Fetching user data for ID: ${userId}`);
            // Get the user data
            const userResponse = await fetch(`${baseUrl}/auth-user.php?userId=${userId}&t=${Date.now()}`);
            if (userResponse.ok && !cancelled) {
              const userData = await userResponse.json();
              if (userData?.authenticated && userData?.user) {
                setDirectUser(userData.user);
                console.log('Direct user data loaded:', userData.user);
                
                // Then get character data
                try {
                  const charactersResponse = await fetch(`${baseUrl}/auth-characters.php?userId=${userId}&t=${Date.now()}`);
                  if (charactersResponse.ok && !cancelled) {
                    const charactersData = await charactersResponse.json();
                    if (charactersData?.data?.characters) {
                      setDirectCharacters(charactersData.data.characters);
                      console.log('Direct characters data loaded:', charactersData.data.characters);
                    } else {
                      console.log('No characters found for user');
                    }
                  }
                } catch (charError) {
                  if (!cancelled) {
                    console.error('Error loading characters directly:', charError);
                  }
                }
                
                if (!cancelled) {
                  setLoadedDirectData(true);
                }
              } else if (!cancelled) {
                setDirectDataError('User data not found or not authenticated');
              }
            } else if (!cancelled) {
              setDirectDataError('Failed to fetch user data');
            }
          } else if (!cancelled) {
            setDirectDataError('No user ID available for direct data loading');
          }
        } catch (error) {
          if (!cancelled) {
            console.error('Error fetching direct data:', error);
            setDirectDataError('Network error while loading data');
          }
        } finally {
          if (!cancelled) {
            setIsLoadingDirectData(false);
          }
        }
      }
    }
    
    fetchDirectUserData();
    
    // Cleanup function to prevent state updates if the component unmounts during data fetching
    return () => {
      cancelled = true;
    };
  }, [alreadyForced, loginSuccess, authData?.authenticated, directUserIdToTry, loadedDirectData, isLoadingDirectData]);

  // If we successfully loaded direct data, use it
  if ((alreadyForced || loginSuccess) && !authData?.authenticated && loadedDirectData && directUser) {
    console.log('Using directly loaded user and character data from PHP endpoints');
    
    return (
      <div className="container py-10 px-4 mx-auto">
        <Alert className="mb-6 bg-amber-400/10 border-amber-400">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Windows Mode</AlertTitle>
          <AlertDescription>
            Using direct data loading method for Windows environments
          </AlertDescription>
        </Alert>
        
        <h1 className="text-4xl font-cinzel text-wow-green mb-2">
          {t('profile.title')}
        </h1>
        <p className="text-wow-light/70 mb-6">
          {t('profile.subtitle')}
        </p>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile" className="text-wow-light hover:text-wow-green">
              <User className="h-4 w-4 mr-2" />
              {t('profile.title')}
            </TabsTrigger>
            <TabsTrigger value="characters" className="text-wow-light hover:text-wow-green">
              <Shield className="h-4 w-4 mr-2" />
              {t('profile.characters')}
            </TabsTrigger>
            <TabsTrigger value="connections" className="text-wow-light hover:text-wow-green">
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('profile.connections') || 'Connections'}
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="text-wow-light hover:text-wow-green">
              <AlertCircle className="h-4 w-4 mr-2" />
              Diagnostics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <UserProfile user={directUser} />
          </TabsContent>
          
          <TabsContent value="characters" className="space-y-6">
            <CharacterList />
          </TabsContent>
          
          <TabsContent value="connections" className="space-y-6">
            <UserConnections user={directUser} />
          </TabsContent>
          
          <TabsContent value="diagnostics" className="space-y-6">
            <BattleNetDiagnostic />
          </TabsContent>
        </Tabs>
      </div>
    );
  }
  
  // Loading state for direct data fetch
  if ((alreadyForced || loginSuccess) && !authData?.authenticated && isLoadingDirectData) {
    return <Loading message="Loading profile data directly for Windows environment..." />;
  }

  // If we already tried forcing the profile view but auth still didn't work and direct loading failed,
  // display a special message for Windows users
  if ((alreadyForced || loginSuccess) && !authData?.authenticated && (forceCounter > 0 || directDataError)) {
    return (
      <div className="container py-10 px-4 mx-auto">
        <Card className="bg-wow-dark border-wow-green/30 p-6">
          <h1 className="text-4xl font-cinzel text-wow-green mb-4">Authentication Status</h1>
          <div className="text-wow-light space-y-4">
            <p className="text-lg">Your login was successful, but we're having trouble loading your profile data.</p>
            <p>This can happen in Windows environments due to session handling differences.</p>
            <p className="text-wow-light/70">Your user ID: {directUserIdToTry || 'Unknown'}</p>
            {directDataError && (
              <Alert variant="destructive" className="mt-4 bg-red-900/20 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error Loading Data</AlertTitle>
                <AlertDescription>
                  {directDataError}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex gap-4 mt-6">
              <Button 
                onClick={() => {
                  // Always clear the force profile flags first to prevent loops
                  const url = new URL(window.location.href);
                  url.searchParams.delete('force_profile');
                  url.searchParams.delete('force_count');
                  url.searchParams.delete('login_success');
                  
                  // Add a timestamp to prevent caching
                  url.searchParams.set('t', Date.now().toString());
                  
                  // Redirect to clean profile page
                  window.location.href = url.toString();
                }}
                className="bg-wow-green hover:bg-wow-green/80"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  // Clear all auth cookies and storage
                  document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  document.cookie = "auth_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  document.cookie = "auth_battle_tag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                  localStorage.removeItem('guttakrutt_auth_timestamp');
                  localStorage.removeItem('guttakrutt_auth_user_id');
                  localStorage.removeItem('guttakrutt_auth_battle_tag');
                  
                  // Redirect to homepage
                  window.location.href = '/';
                }}
                className="border-wow-green/30 text-wow-light hover:bg-wow-dark/50"
              >
                Return to Homepage
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container py-10 px-4 mx-auto">
      <h1 className="text-4xl font-cinzel text-wow-green mb-2">
        {t('profile.title')}
      </h1>
      <p className="text-wow-light/70 mb-6">
        {t('profile.subtitle')}
      </p>
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="text-wow-light hover:text-wow-green">
            <User className="h-4 w-4 mr-2" />
            {t('profile.title')}
          </TabsTrigger>
          <TabsTrigger value="characters" className="text-wow-light hover:text-wow-green">
            <Shield className="h-4 w-4 mr-2" />
            {t('profile.characters')}
          </TabsTrigger>
          <TabsTrigger value="connections" className="text-wow-light hover:text-wow-green">
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('profile.connections')}
          </TabsTrigger>
          <TabsTrigger value="diagnostics" className="text-wow-light hover:text-wow-green">
            <AlertCircle className="h-4 w-4 mr-2" />
            Diagnostics
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <UserProfile user={authData?.user} />
        </TabsContent>
        
        <TabsContent value="characters" className="space-y-6">
          <CharacterList />
        </TabsContent>
        
        <TabsContent value="connections" className="space-y-6">
          <UserConnections user={authData?.user} />
        </TabsContent>
        
        <TabsContent value="diagnostics" className="space-y-6">
          <BattleNetDiagnostic />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserProfile({ user }: { user?: UserData | null }) {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  
  if (!user) return null;
  
  const handleLogout = async () => {
    try {
      // Using API request with automatic endpoint conversion for both environments
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/'; // Redirect to homepage after logout
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <Card className="shadow-lg bg-black/90 border-wow-green/40">
      <CardHeader className="bg-gradient-to-b from-slate-900 to-black pb-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.battleTag} 
              className="h-16 w-16 rounded-full border-2 border-wow-green/60 shadow-[0_0_10px_rgba(80,255,100,0.3)]"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-slate-800 border-2 border-wow-green/40 flex items-center justify-center">
              <User className="h-8 w-8 text-wow-green/70" />
            </div>
          )}
          <div>
            <CardTitle className="text-2xl text-white font-bold font-cinzel drop-shadow-md">
              {user.battleTag || user.username || t('profile.unknown')}
            </CardTitle>
            <div className="flex flex-wrap gap-2 mt-1">
              {user.isGuildMember && (
                <Badge className="bg-wow-green/20 hover:bg-wow-green/30 text-white border border-wow-green/60">
                  {t('guild.mainTeam')}
                </Badge>
              )}
              {user.isOfficer && (
                <Badge className="bg-amber-700/30 hover:bg-amber-700/40 text-amber-200 border border-amber-500/60">
                  {t('guild.officer')}
                </Badge>
              )}
              {user.battleNetId && (
                <Badge className="bg-blue-900/30 hover:bg-blue-900/40 text-blue-200 border border-blue-500/60">
                  Battle.net
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 pb-8 space-y-6">
        {/* User information section with improved readability */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-4 gap-x-8">
          {/* Account Info */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-white font-semibold text-lg mb-3 font-cinzel border-b border-slate-700/50 pb-2">
              {t('profile.accountInfo')}
            </h3>
            <div className="space-y-3">
              {/* Username */}
              {user.username && (
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-wow-green" />
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">{t('profile.username')}</span>
                    <span className="text-white">{user.username}</span>
                  </div>
                </div>
              )}
              
              {/* Email */}
              {user.email && (
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-wow-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">{t('profile.email')}</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                </div>
              )}
              
              {/* Member Since */}
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-wow-green" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">{t('profile.memberSince')}</span>
                  <span className="text-white">
                    {user.createdAt ? format(new Date(user.createdAt), 'PP') : '-'}
                  </span>
                </div>
              </div>
              
              {/* Last Login */}
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-wow-green" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">{t('profile.lastLogin')}</span>
                  <span className="text-white">
                    {user.lastLogin ? format(new Date(user.lastLogin), 'PPp') : '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Battle.net Info */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-white font-semibold text-lg mb-3 font-cinzel border-b border-slate-700/50 pb-2">
              {t('profile.battleNetInfo')}
            </h3>
            <div className="space-y-3">
              {/* BattleTag */}
              {user.battleTag && (
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5 text-wow-green" fill="currentColor">
                    <path d="M20.3,3.7c-0.5-0.5-1.1-0.8-1.8-0.8H5.5c-0.7,0-1.3,0.3-1.8,0.8C3.3,4.2,3,4.8,3,5.5v13.1c0,0.7,0.3,1.3,0.8,1.8 c0.5,0.5,1.1,0.8,1.8,0.8h13.1c0.7,0,1.3-0.3,1.8-0.8c0.5-0.5,0.8-1.1,0.8-1.8V5.5C21,4.8,20.7,4.2,20.3,3.7z M10.9,14.2H8.5 l-1.3,2.2H4.9l5.6-9.4h0.9l5.6,9.4h-2.3l-1.3-2.2H10.9z M11.5,12.6l-1-1.7l-1,1.7H11.5z"/>
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400">{t('profile.battleTag')}</span>
                    <span className="text-white">{user.battleTag}</span>
                  </div>
                </div>
              )}
              
              {/* Region */}
              <div className="flex items-center gap-3">
                <Globe2 className="h-5 w-5 text-wow-green" />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">{t('profile.region')}</span>
                  <span className="text-white uppercase">{user.region || '-'}</span>
                </div>
              </div>
              
              {/* Locale */}
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-wow-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m4 18 6-12 6 12"/>
                  <path d="M4 14h12"/>
                </svg>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">{t('profile.locale')}</span>
                  <span className="text-white">{user.locale || '-'}</span>
                </div>
              </div>
              
              {/* Connection Status */}
              <div className="flex items-center gap-3">
                <Check className={`h-5 w-5 ${user.battleNetId ? 'text-green-500' : 'text-red-500'}`} />
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">{t('profile.connectionStatus')}</span>
                  <span className={`${user.battleNetId ? 'text-green-400' : 'text-red-400'}`}>
                    {user.battleNetId ? t('profile.connected') : t('profile.notConnected')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="border-t border-slate-800 pt-4 bg-slate-900/30">
        <Button 
          variant="destructive" 
          className="ml-auto bg-red-900/80 hover:bg-red-800 border border-red-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {t('profile.logout')}
        </Button>
      </CardFooter>
    </Card>
  );
}

function CharactersList({ characters }: { characters: UserCharacter[] }) {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  
  return (
    <>
      <Card className="shadow-lg bg-black/90 border-wow-green/40">
        <CardHeader className="bg-gradient-to-b from-slate-900 to-black pb-6">
          <CardTitle className="text-2xl text-white font-bold font-cinzel drop-shadow-md">
            {t('profile.characters')}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {t('profile.charactersSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          {characters.length === 0 ? (
            <div className="bg-slate-900/50 rounded-lg p-6 text-center border border-slate-700/50">
              <div className="h-20 w-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-600">
                <Shield className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-white mb-3">{t('profile.noCharacters')}</p>
              <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
                {t('profile.noCharactersDescription') || 'Connect your Battle.net account to see your characters here.'}
              </p>
              <Button 
                variant="outline" 
                className="border-wow-green/40 text-white bg-wow-green/10 hover:bg-wow-green/20 hover:text-white hover:border-wow-green"
                onClick={(e) => {
                  e.preventDefault();
                  // Use Battle.net authentication with automatic URL conversion
                  const defaultUrl = '/api/auth/bnet';
                  const timestamp = Date.now();
                  
                  // Use URL parameters for special cases
                  const urlParams = new URLSearchParams(window.location.search);
                  const useSpecialAuth = urlParams.get('auth');
                  
                  if (useSpecialAuth === 'windows') {
                    window.location.href = `/windows-auth/login?t=${timestamp}`;
                  } else if (useSpecialAuth === 'direct') {
                    window.location.href = `/api/direct/login?t=${timestamp}`;
                  } else {
                    // Standard Battle.net auth with automatic URL conversion
                    window.location.href = getProperEndpoint(defaultUrl) + `?t=${timestamp}`;
                  }
                }}
              >
                <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.3,3.7c-0.5-0.5-1.1-0.8-1.8-0.8H5.5c-0.7,0-1.3,0.3-1.8,0.8C3.3,4.2,3,4.8,3,5.5v13.1c0,0.7,0.3,1.3,0.8,1.8 c0.5,0.5,1.1,0.8,1.8,0.8h13.1c0.7,0,1.3-0.3,1.8-0.8c0.5-0.5,0.8-1.1,0.8-1.8V5.5C21,4.8,20.7,4.2,20.3,3.7z M10.9,14.2H8.5 l-1.3,2.2H4.9l5.6-9.4h0.9l5.6,9.4h-2.3l-1.3-2.2H10.9z M11.5,12.6l-1-1.7l-1,1.7H11.5z"/>
                </svg>
                {t('profile.linkCharacter')}
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-white font-semibold text-lg font-cinzel border-b border-slate-700/50 pb-2">
                {t('profile.characterLinked')}
              </h3>
              <div className="grid gap-4">
                {characters.map((character) => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function CharacterCard({ character }: { character: UserCharacter }) {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  
  // Fix TypeScript error by providing a fallback for undefined className
  const classColor = getClassColor(character.className || character.class || '');
  
  return (
    <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 flex flex-col md:flex-row items-start md:items-center gap-4 hover:bg-slate-800/50 transition-colors">
      <div className="flex-shrink-0">
        {character.avatarUrl ? (
          <img 
            src={character.avatarUrl} 
            alt={character.name} 
            className="h-16 w-16 rounded-md border border-slate-600/60 shadow-md"
          />
        ) : (
          <div className="h-16 w-16 rounded-md bg-slate-800 flex items-center justify-center border border-slate-600/60 shadow-md">
            <Shield className="h-8 w-8 text-slate-400" />
          </div>
        )}
      </div>
      
      <div className="flex-grow">
        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
          <h3 className="text-xl font-bold font-cinzel drop-shadow-sm" style={{ color: classColor }}>
            {character.name}
          </h3>
          
          <div className="flex items-center flex-wrap gap-1 text-slate-300">
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-sm">{character.level}</span>
            <span className="text-slate-500 mx-1">•</span>
            <span className="bg-slate-800/80 px-2 py-0.5 rounded text-sm">{character.className}</span>
            {character.specName && (
              <>
                <span className="text-slate-500 mx-1">•</span>
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-sm">{character.specName}</span>
              </>
            )}
            {character.itemLevel && (
              <>
                <span className="text-slate-500 mx-1">•</span>
                <span className="bg-slate-800/80 px-2 py-0.5 rounded text-sm">
                  <span className="text-amber-400 font-medium">{character.itemLevel}</span> {t('profile.ilevel')}
                </span>
              </>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-sm text-slate-400">
          {character.guild ? (
            <span className="text-slate-300">&lt;{character.guild}&gt;</span>
          ) : ''} {character.realm}
        </div>
        
        <div className="mt-3 flex flex-wrap gap-2">
          {character.isMain && (
            <Badge className="bg-green-900/30 hover:bg-green-900/40 text-green-200 border border-green-700/50">
              <Check className="h-3 w-3 mr-1" />
              {t('profile.main')}
            </Badge>
          )}
          
          {character.verified ? (
            <Badge className="bg-blue-900/30 hover:bg-blue-900/40 text-blue-200 border border-blue-700/50">
              <Check className="h-3 w-3 mr-1" />
              {t('profile.verified')}
            </Badge>
          ) : (
            <Badge className="bg-amber-900/30 hover:bg-amber-900/40 text-amber-200 border border-amber-700/50">
              <Clock className="h-3 w-3 mr-1" />
              {t('profile.pending')}
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex-shrink-0 flex flex-col gap-2 w-full md:w-auto mt-4 md:mt-0">
        {!character.verified && (
          <Button 
            variant="outline" 
            size="sm"
            className="border-wow-green/40 text-white bg-wow-green/10 hover:bg-wow-green/20 hover:text-white hover:border-wow-green w-full md:w-auto"
            onClick={(e) => {
              e.preventDefault();
              // Use Battle.net authentication with automatic URL conversion
              const defaultUrl = '/api/auth/bnet';
              const timestamp = Date.now();
              
              // Use URL parameters for special cases
              const urlParams = new URLSearchParams(window.location.search);
              const useSpecialAuth = urlParams.get('auth');
              
              if (useSpecialAuth === 'windows') {
                window.location.href = `/windows-auth/login?t=${timestamp}`;
              } else if (useSpecialAuth === 'direct') {
                window.location.href = `/api/direct/login?t=${timestamp}`;
              } else {
                // Standard Battle.net auth with automatic URL conversion
                window.location.href = getProperEndpoint(defaultUrl) + `?t=${timestamp}`;
              }
            }}
          >
            <Check className="h-4 w-4 mr-2" />
            {t('profile.verify')}
          </Button>
        )}
        
        {character.verified && !character.isMain && (
          <Button 
            variant="outline" 
            size="sm"
            className="border-slate-600 text-white bg-slate-800/80 hover:bg-slate-700 hover:border-slate-500 w-full md:w-auto"
            onClick={() => apiRequest('POST', `/api/auth/characters/${character.id}/main`)}
          >
            <Shield className="h-4 w-4 mr-2" />
            {t('profile.setAsMain')}
          </Button>
        )}
        
        {character.armoryLink && (
          <Button
            variant="link"
            size="sm"
            className="text-blue-400 hover:text-blue-300 w-full md:w-auto"
            onClick={() => window.open(character.armoryLink, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('profile.armory')}
          </Button>
        )}
      </div>
    </div>
  );
}

function LoginRequired(): JSX.Element {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  const { toast } = useToast(); // Make sure this is at top level
  
  // Function to handle login with proper redirection for different environments
  const handleBattleNetLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    try {
      // Log start of login process with full details
      console.log('Starting Battle.net login process...');
      console.log('Environment:', window.location.hostname);
      console.log('Is Production:', window.location.hostname.includes('guttakrutt.org'));
      
      // Add cache-busting timestamp to prevent login loops
      const timestamp = Date.now();
      
      // Get special debug parameter if any
      const urlParams = new URLSearchParams(window.location.search);
      const useSpecialAuth = urlParams.get('auth');
      
      // Handle special auth methods first
      if (useSpecialAuth === 'windows') {
        // Use Windows-specific simplified auth endpoint (bypasses PHP)
        console.log('Using Windows-specific simplified auth endpoint');
        window.location.href = `/windows-auth/login?t=${timestamp}`;
        return;
      } 
      
      if (useSpecialAuth === 'direct') {
        // Use direct auth endpoint
        console.log('Using direct auth endpoint');
        const directEndpoint = getProperEndpoint('/api/direct/login');
        console.log('Direct login URL:', directEndpoint);
        window.location.href = `${directEndpoint}?t=${timestamp}&format=json`;
        return;
      }
      
      // Standard Battle.net auth with automatic URL conversion
      console.log('Using standard Battle.net auth with automatic URL conversion');
      const defaultUrl = '/api/auth/bnet';
      const convertedUrl = getProperEndpoint(defaultUrl);
      console.log('Converted auth URL:', convertedUrl);
      
      // Add timestamp parameter to prevent caching issues
      const finalUrl = `${convertedUrl}${convertedUrl.includes('?') ? '&' : '?'}t=${timestamp}`;
      console.log('Final login URL:', finalUrl);
      
      // Redirect to login page
      window.location.href = finalUrl;
    } catch (error) {
      console.error('Error in login process:', error);
      // Continue with standard login flow if any error occurs in the handling
      window.location.href = '/api/auth/bnet?fallback=true&t=' + Date.now();
    }
  };
  
  // Debug function to directly authenticate with server
  const handleDirectLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Prevent multiple clicks and infinite loops
    const button = e.currentTarget as HTMLButtonElement;
    if (button) button.disabled = true;
    
    // Show a toast to indicate we're processing the login
    toast({
      title: "Debug Login",
      description: "Attempting direct debug login...",
      variant: "default",
    });
    
    console.log('Attempting direct server login...');
    
    try {
      // First try the PHP simulation endpoint for Windows compatibility
      console.log('Trying auth-direct-check.php endpoint (for Windows)...');
      
      // Get a test user ID - first from localStorage if available, otherwise use 1
      const userId = localStorage.getItem('guttakrutt_auth_user_id') || '1';
      
      const phpEndpoint = `/auth-direct-check.php?userId=${userId}&t=${Date.now()}`; // Add timestamp to prevent caching
      
      try {
        const phpResponse = await fetch(phpEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store'
          },
          credentials: 'include' // Important for cookie-based auth
        });
        
        if (!phpResponse.ok) {
          console.log(`PHP endpoint returned ${phpResponse.status}, falling back to API endpoint`);
          
          // Continue to API endpoint
        } else {
          let phpData;
          try {
            phpData = await phpResponse.json();
            console.log('PHP debug login response:', phpData);
            
            // Check success from different response formats
            const isSuccess = phpData.success || 
                            (phpData.data && (phpData.data.success || phpData.data.authenticated));
            
            if (isSuccess) {
              console.log('PHP debug login successful');
              
              // Get user data from the correct location in the response
              const userData = phpData.user || (phpData.data && phpData.data.user);
              
              if (userData) {
                toast({
                  title: "Login Successful",
                  description: `Logged in as ${userData.battleTag || 'Developer User'} (via PHP simulation)`,
                  variant: "default",
                });
                
                // Store authentication in localStorage
                localStorage.setItem('guttakrutt_auth_user_id', userData.id.toString() || userId);
                localStorage.setItem('guttakrutt_auth_battle_tag', userData.battleTag || 'DevUser#1234');
                localStorage.setItem('guttakrutt_auth_timestamp', Date.now().toString());
                
                // Don't refetch, just redirect to a fresh page with a cache-busting parameter
                window.location.href = `/profile?login_success=true&t=${Date.now()}`;
                return;
              }
            }
          } catch (error) {
            console.log('Error parsing PHP response, falling back to API endpoint');
          }
        }
      } catch (error) {
        console.log('Error with PHP endpoint, falling back to API endpoint:', error);
      }
      
      // If PHP endpoint failed or isn't available, try the standard debug login endpoint
      console.log('Trying debug login endpoint...');
      const debugEndpoint = `/api/auth/debug-login?t=${Date.now()}`; // Add timestamp to prevent caching
      
      // Use proper fetch with error handling
      const response = await fetch(debugEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store'
        },
        credentials: 'include' // Important for cookie-based auth
      });
      
      if (!response.ok) {
        // Handle HTTP errors
        const errorText = await response.text();
        console.error(`Debug login HTTP error (${response.status}):`, errorText);
        
        toast({
          title: "Login Failed",
          description: `Server returned error: ${response.status}`,
          variant: "destructive",
        });
        
        // Re-enable the button
        if (button) button.disabled = false;
        return;
      }
      
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Error parsing response:', error);
        
        // If we can't parse the response as JSON, show the error
        toast({
          title: "Login Failed",
          description: "Received invalid response from server. See console for details.",
          variant: "destructive",
        });
        
        // Re-enable the button
        if (button) button.disabled = false;
        return;
      }
      
      console.log('Debug login response:', data);
      
      // Check if login was successful
      if (data.success) {
        console.log('Debug login successful');
        toast({
          title: "Login Successful",
          description: `Logged in as ${data.user?.battleTag || 'Developer User'}`,
          variant: "default",
        });
        
        // Store authentication in localStorage as a fallback
        localStorage.setItem('guttakrutt_auth_user_id', data.user?.id.toString() || '1');
        localStorage.setItem('guttakrutt_auth_battle_tag', data.user?.battleTag || 'DevUser#1234');
        localStorage.setItem('guttakrutt_auth_timestamp', Date.now().toString());
        
        // Redirect to a fresh page with a cache-busting parameter instead of reloading
        window.location.href = `/profile?login_success=true&t=${Date.now()}`;
      } else {
        console.error('Debug login failed:', data.error);
        toast({
          title: "Login Failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        });
        
        // Re-enable the button
        if (button) button.disabled = false;
      }
    } catch (error: any) {
      console.error('Error during direct login:', error);
      toast({
        title: "Login Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
      
      // Re-enable the button
      if (button) button.disabled = false;
    }
  };

  return (
    <div className="container py-10 px-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-2xl w-full">
        {/* Main card with login options */}
        <Card className="w-full bg-wow-dark border-wow-green/30 mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-cinzel text-wow-green">{t('profile.loginRequired')}</CardTitle>
            <CardDescription className="text-wow-light/70 text-lg">
              {t('profile.loginNeeded')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-8 p-4 rounded-lg bg-wow-green/5 border border-wow-green/20">
              <p className="text-wow-light mb-6">
                {t('profile.loginWithBattleNet')}
              </p>
              
              <Button 
                size="lg"
                className="bg-wow-green/90 text-white hover:bg-wow-green border border-wow-green/20"
                onClick={(e) => {
                  e.preventDefault();
                  // Use direct href instead of the function
                  const timestamp = Date.now();
                  // First try the auth-bnet.php endpoint which works in production
                  window.location.href = `/auth-bnet.php?t=${timestamp}`;
                }}
              >
                <LogOut className="h-5 w-5 mr-2" />
                {t('header.login')}
              </Button>
            </div>
            
            <Separator className="my-6 bg-wow-green/10" />
            
            <div className="text-sm text-wow-light/60">
              <h4 className="font-medium text-wow-light/80 mb-2">Having trouble connecting?</h4>
              <p className="mb-4">If you're experiencing login issues, try one of these options:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-wow-green/20 text-wow-green hover:bg-wow-green/10"
                  onClick={(e) => {
                    e.preventDefault();
                    // Clear any existing cookies first
                    document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    document.cookie = "auth_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    document.cookie = "auth_battle_tag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    localStorage.removeItem('guttakrutt_auth_timestamp');
                    localStorage.removeItem('guttakrutt_auth_user_id');
                    localStorage.removeItem('guttakrutt_auth_battle_tag');
                    
                    // Add special parameter to use Windows environment auth
                    const url = new URL(window.location.href);
                    url.searchParams.set('auth', 'windows');
                    window.location.href = url.toString();
                  }}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Windows Login
                </Button>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="border-wow-green/20 text-wow-green hover:bg-wow-green/10"
                  onClick={(e) => {
                    e.preventDefault();
                    // Clear any existing cookies first
                    document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    document.cookie = "auth_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    document.cookie = "auth_battle_tag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                    localStorage.removeItem('guttakrutt_auth_timestamp');
                    localStorage.removeItem('guttakrutt_auth_user_id');
                    localStorage.removeItem('guttakrutt_auth_battle_tag');
                    
                    // Add special parameter to use direct API auth
                    const url = new URL(window.location.href);
                    url.searchParams.set('auth', 'direct');
                    window.location.href = url.toString();
                  }}
                >
                  <User className="h-4 w-4 mr-2" />
                  Direct Login
                </Button>
              </div>
            </div>
            
            <Separator className="my-6 bg-wow-green/10" />
            
            {/* Debug button - moved to the bottom and styled as a text link */}
            <div className="mt-4">
              <Button 
                variant="link" 
                size="sm"
                className="text-amber-400/70 hover:text-amber-400" 
                onClick={handleDirectLogin}
              >
                <Shield className="h-3 w-3 mr-1" />
                <span className="text-xs">Debug Login</span>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Info card explaining login */}
        <Card className="w-full bg-wow-dark/70 border-wow-green/20">
          <CardHeader>
            <CardTitle className="text-xl text-wow-green">About Battle.net Login</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-wow-light/70 text-sm mb-4">
              Guttakrutt uses Battle.net authentication to securely verify your identity. No password is stored on our servers.
            </p>
            <p className="text-wow-light/70 text-sm">
              This allows us to automatically detect if you are a member of the Guttakrutt guild and provide you with the appropriate access to features based on your role.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Loading({ message }: { message?: string }) {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  
  return (
    <div className="container py-10 px-4 mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-16 h-16 border-4 border-wow-green/30 border-t-wow-green rounded-full animate-spin mb-6"></div>
      {message && (
        <div className="text-wow-light text-center max-w-md">
          <p>{message}</p>
          <p className="text-wow-light/70 text-sm mt-2">{t('misc.pleaseWait')}</p>
        </div>
      )}
    </div>
  );
}

function Error({ message }: { message: string }) {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  
  return (
    <div className="container py-10 px-4 mx-auto flex items-center justify-center min-h-[60vh]">
      <div className="max-w-xl w-full">
        <Card className="w-full bg-wow-dark border-red-500/30 mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </div>
            <CardTitle className="text-2xl font-cinzel text-red-500 text-center">{t('misc.error')}</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/20">
              <p className="text-red-300">{message}</p>
            </div>
            <p className="text-wow-light/70 text-sm mb-6">
              This could be due to network connectivity issues or a temporary server problem.
            </p>
          </CardContent>
          <CardFooter className="flex justify-center gap-3 pt-0">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t('misc.retry')}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => {
                // Clear caches and all authentication cookies
                document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "auth_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                document.cookie = "auth_battle_tag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                localStorage.removeItem('guttakrutt_auth_timestamp');
                localStorage.removeItem('guttakrutt_auth_user_id');
                localStorage.removeItem('guttakrutt_auth_battle_tag');
                window.location.href = '/profile?refresh=' + Date.now();
              }}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('misc.clearAndRetry')}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="bg-wow-dark/70 border border-wow-green/20 p-4 rounded-lg">
          <h3 className="text-md font-medium text-wow-green mb-2">Need help?</h3>
          <p className="text-wow-light/70 text-sm mb-3">
            If you continue to experience issues, try these steps:
          </p>
          <ol className="text-wow-light/70 text-sm space-y-2 list-decimal pl-5">
            <li>Check your internet connection</li>
            <li>Clear your browser cache</li>
            <li>Try logging in through the main website at <a href="https://guttakrutt.org" className="text-wow-green hover:underline">guttakrutt.org</a></li>
            <li>Contact us on <a href="https://discord.gg/X3Wjdh4HvC" className="text-wow-green hover:underline">Discord</a> for assistance</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

// Helper function to get class color
function getClassColor(className: string): string {
  const classColors: Record<string, string> = {
    'Death Knight': '#C41E3A',
    'Demon Hunter': '#A330C9',
    'Druid': '#FF7C0A',
    'Evoker': '#33937F',
    'Hunter': '#AAD372',
    'Mage': '#3FC7EB',
    'Monk': '#00FF98',
    'Paladin': '#F48CBA',
    'Priest': '#FFFFFF',
    'Rogue': '#FFF468',
    'Shaman': '#0070DD',
    'Warlock': '#8788EE',
    'Warrior': '#C69B6D'
  };
  
  return classColors[className] || '#FFFFFF';
}

// Component for user account connections (Battle.net etc)
function UserConnections({ user }: { user?: UserData | null }) {
  // Important: All hooks must be called unconditionally at the top level!
  const { t } = useTranslation();
  
  if (!user) return null;
  
  // Import the ConnectBattleNet component
  const ConnectBattleNet = React.lazy(() => import('@/components/connect-battle-net').then(
    module => ({ default: module.ConnectBattleNet })
  ));
  
  return (
    <>
      <Card className="shadow-lg bg-black/90 border-wow-green/40">
        <CardHeader className="bg-gradient-to-b from-slate-900 to-black pb-6">
          <CardTitle className="text-2xl text-white font-bold font-cinzel drop-shadow-md">
            {t('profile.connections') || 'Account Connections'}
          </CardTitle>
          <CardDescription className="text-slate-300">
            {t('profile.connectionsSubtitle') || 'Connect your Battle.net account to access additional features'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 pb-8">
          {/* Connection status info */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 mb-6">
            <h3 className="text-white font-semibold text-lg mb-3 font-cinzel border-b border-slate-700/50 pb-2">
              {t('profile.connectionStatus') || 'Connection Status'}
            </h3>
            
            <div className="flex items-center gap-3 mb-4">
              {user.battleNetId ? (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center border border-green-700/40">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center border border-amber-700/40">
                  <AlertCircle className="h-6 w-6 text-amber-400" />
                </div>
              )}
              
              <div>
                <h4 className="text-white font-medium">
                  {user.battleNetId 
                    ? t('profile.battleNetConnected') || 'Battle.net Connected' 
                    : t('profile.battleNetNotConnected') || 'Battle.net Not Connected'}
                </h4>
                <p className="text-slate-400 text-sm">
                  {user.battleNetId 
                    ? t('profile.battleNetConnectedDesc') || `Your account is connected to Battle.net as ${user.battleTag || ''}` 
                    : t('profile.battleNetNotConnectedDesc') || 'Connect your Battle.net account to verify your World of Warcraft characters'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Battle.net connection component */}
          <React.Suspense fallback={
            <div className="flex items-center justify-center h-40 bg-slate-900/30 rounded-lg border border-slate-800/50">
              <div className="animate-spin h-10 w-10 border-4 border-slate-700 border-t-wow-green rounded-full" />
            </div>
          }>
            <ConnectBattleNet />
          </React.Suspense>
        </CardContent>
      </Card>
    </>
  );
}