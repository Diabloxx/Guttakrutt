import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Authentication context interface
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  refreshAuth: () => void;
  refreshUserCharacters: () => void;
  characters: UserCharacter[];
  mainCharacter: UserCharacter | null;
  directLogin: (token: string, userId: string, redirect?: string) => Promise<boolean>;
  setMainCharacterMutation: any;
  linkCharacterMutation: any;
  logout: () => void;
  login: (username: string, password: string) => Promise<boolean>; // Standard login
  register: (userData: RegisterData) => Promise<boolean>; // User registration
  connectBattleNet: (battleNetData: BattleNetData) => Promise<boolean>; // Connect Battle.net account
}

// Registration data interface
interface RegisterData {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

// Battle.net connection data interface
interface BattleNetData {
  battleNetId: string;
  battleTag: string;
  accessToken: string;
  refreshToken: string;
  tokenExpiry: string | Date;
}

// User interface (matching the updated schema.User)
interface User {
  id: number;
  username: string;
  displayName?: string;
  email?: string;
  lastLogin?: string;
  createdAt?: string;
  isGuildMember?: boolean;
  isOfficer?: boolean;
  region?: string;
  locale?: string;
  avatarUrl?: string;
  // Legacy Battle.net fields
  battleNetId?: string;
  battleTag?: string;
}

// User's character interface
interface UserCharacter {
  id: number;
  name: string;
  realm: string;
  class: string;
  level: number;
  itemLevel?: number;
  avatarUrl?: string;
  spec?: string;
  isMain: boolean;
  verified: boolean;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider props interface
interface AuthProviderProps {
  children: ReactNode;
}

// Cache busting parameter to prevent stale responses
const getCacheBuster = () => `_cb=${new Date().getTime()}`;

/**
 * Authentication provider component
 * Handles user authentication state and related operations
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [refreshCount, setRefreshCount] = useState(0);
  const [mainCharacter, setMainCharacter] = useState<UserCharacter | null>(null);
  const [characters, setCharacters] = useState<UserCharacter[]>([]);
  const [attemptCounter, setAttemptCounter] = useState(0);
  
  // Get current user data
  const {
    data: authData,
    isLoading,
    error,
    refetch: refreshAuth
  } = useQuery({
    queryKey: ['auth', refreshCount],
    queryFn: async () => {
      const response = await axios.get(`/api/auth/user?${getCacheBuster()}`);
      return response.data;
    },
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Get user's characters
  const { 
    data: characterData,
    refetch: refreshUserCharacters
  } = useQuery({
    queryKey: ['userCharacters', authData?.user?.id, refreshCount],
    queryFn: async () => {
      if (!authData?.authenticated || !authData?.user?.id) {
        return { data: { characters: [] } };
      }
      const response = await axios.get(`/api/characters?${getCacheBuster()}`);
      return response.data;
    },
    enabled: !!authData?.authenticated && !!authData?.user?.id,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Extract user and characters data
  const user = authData?.authenticated ? authData.user : null;
  
  // Set main character and characters when data changes
  useEffect(() => {
    if (characterData?.data?.characters) {
      setCharacters(characterData.data.characters);
      
      // Find main character
      const main = characterData.data.characters.find((char: UserCharacter) => char.isMain);
      setMainCharacter(main || null);
    } else {
      setCharacters([]);
      setMainCharacter(null);
    }
  }, [characterData]);
  
  // Auto-refresh auth status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 1000 * 60 * 30); // 30 minutes
    
    return () => clearInterval(interval);
  }, []);
  
  // Attempt to authenticate once on first load and check URL parameters
  useEffect(() => {
    // Check URL for login=success parameter
    const urlParams = new URLSearchParams(window.location.search);
    const loginSuccess = urlParams.get('login') === 'success';
    
    // If login=success is in URL, force a refresh
    if (loginSuccess) {
      console.log('Login success parameter detected in URL, refreshing auth state');
      setRefreshCount(prev => prev + 1);
      
      // Clean up URL parameters for cleaner navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
      return;
    }
    
    // Only attempt a few times to avoid infinite loop
    if (!user && !isLoading && attemptCounter < 3) {
      const timeoutId = setTimeout(() => {
        setAttemptCounter(prev => prev + 1);
        setRefreshCount(prev => prev + 1);
      }, 1000); // Wait 1 second before trying again
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, isLoading, attemptCounter]);
  
  // Username/password login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      if (response.data && response.status === 200) {
        // Refresh auth state after successful login
        await refreshAuth();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };
  
  // User registration function
  const register = async (userData: RegisterData): Promise<boolean> => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data && response.status === 201) {
        // Refresh auth state after successful registration
        await refreshAuth();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  // Legacy Battle.net login mutation (kept for backward compatibility)
  const loginMutation = useMutation({
    mutationFn: async (provider: string = 'bnet') => {
      toast({
        title: "Legacy login method",
        description: "This login method is no longer supported. Please use the standard login form.",
        variant: "destructive"
      });
      return false;
    },
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Determine if we're on guttakrutt.org and use appropriate endpoint
      const isGuttakruttDomain = window.location.hostname === 'guttakrutt.org' || 
                              window.location.hostname === 'www.guttakrutt.org';
      
      let response;
      if (isGuttakruttDomain) {
        console.log('Using PHP simulation logout endpoint for guttakrutt.org');
        response = await axios.get(`/auth-logout.php?${getCacheBuster()}`);
      } else {
        console.log('Using API logout endpoint');
        response = await axios.post(`/api/auth/logout?${getCacheBuster()}`);
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.invalidateQueries({ queryKey: ['userCharacters'] });
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Enhanced logout function with improved response handling across all environments
  const logout = async () => {
    try {
      console.log("Starting logout process");
      
      // First clear all local state and cache to ensure a clean UI even if server call fails
      // Force invalidate auth queries
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      queryClient.setQueryData(['auth'], { authenticated: false, user: null });
      
      // Invalidate character data
      queryClient.invalidateQueries({ queryKey: ['userCharacters'] });
      queryClient.setQueryData(['userCharacters'], { data: { characters: [] } });
      
      // Update local state
      setCharacters([]);
      setMainCharacter(null);
      
      // Clear any auth-related cookies directly from the client side as well
      // This ensures that even if server-side logout fails, client is still logged out
      document.cookie = "guttakrutt_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "auth_redirect=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "auth_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "auth_battle_tag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      document.cookie = "connect.sid=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      
      // Clear any localStorage values related to auth
      try {
        localStorage.removeItem('guttakrutt_auth_timestamp');
        localStorage.removeItem('guttakrutt_auth_user_id');
        localStorage.removeItem('guttakrutt_auth_battle_tag');
      } catch (e) {
        console.warn("Could not clear localStorage:", e);
      }
      
      // Determine if we're on guttakrutt.org and use appropriate endpoint
      const isGuttakruttDomain = window.location.hostname === 'guttakrutt.org' || 
                               window.location.hostname === 'www.guttakrutt.org';
      
      // Now call the server to actually logout
      try {
        console.log("Attempting server-side logout");
        
        // For Windows/MySQL environment, use a direct fetch to the auth-logout.php endpoint
        // with format=json to ensure we get a proper JSON response
        if (isGuttakruttDomain) {
          // Use direct fetch instead of mutation to ensure it works in all environments
          const cacheBuster = new Date().getTime();
          const logoutResponse = await fetch(`/auth-logout.php?format=json&t=${cacheBuster}`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Cache-Control': 'no-cache, no-store, must-revalidate'
            }
          });
          
          if (logoutResponse.ok) {
            console.log("Windows/MySQL server-side logout successful");
          } else {
            console.warn("Windows/MySQL server-side logout issue:", await logoutResponse.text());
          }
        } else {
          // For other environments, use the standard mutation
          const logoutPromise = logoutMutation.mutateAsync();
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Logout timeout")), 5000)
          );
          
          // Race between the logout call and timeout
          await Promise.race([logoutPromise, timeoutPromise]);
          console.log("Server-side logout successful");
        }
      } catch (serverError) {
        // Log but continue - we'll still clear local state and redirect
        console.warn("Server-side logout issue:", serverError);
        // We'll still consider the logout successful from the user's perspective
      }
      
      // Force refresh the auth state
      setRefreshCount(count => count + 1);
      
      // Add a slightly longer delay to ensure cookies are cleared before redirect
      console.log("Logout completed, redirecting to home page");
      
      // Display success toast
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account",
      });
      
      // Navigate to home page with cache-busting parameter
      const cacheBuster = new Date().getTime();
      window.location.href = `/?clear_session=${cacheBuster}`;
      
      return true;
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Set main character mutation
  const setMainCharacterMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const response = await axios.post('/api/characters/main', {
        characterId
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCharacters'] });
      toast({
        title: "Main character set",
        description: "Your main character has been updated",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to set main character",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Link character mutation
  const linkCharacterMutation = useMutation({
    mutationFn: async (data: { characterId: number, verified?: boolean }) => {
      const response = await axios.post('/api/characters/link', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userCharacters'] });
      toast({
        title: "Character linked",
        description: "The character has been linked to your account",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to link character",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Legacy direct login function (kept for backward compatibility)
  const directLogin = async (token: string, userId: string, redirect: string = '/'): Promise<boolean> => {
    try {
      // Using new API endpoint instead of PHP simulation
      const response = await axios.post('/api/auth/direct-login', {
        token,
        userId,
        redirectUrl: redirect
      });
      
      if (response.data.success) {
        await refreshAuth();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Direct login failed:', error);
      return false;
    }
  };
  
  // Connect a Battle.net account to the current user account
  const connectBattleNet = async (battleNetData: BattleNetData): Promise<boolean> => {
    try {
      // Check if user is logged in
      if (!user) {
        toast({
          title: "Authentication required",
          description: "You must be logged in to connect a Battle.net account",
          variant: "destructive"
        });
        return false;
      }
      
      // Call the API to connect the Battle.net account
      const response = await axios.post('/api/auth/connect-bnet', battleNetData);
      
      if (response.data.success) {
        // Refresh auth state after successful connection
        await refreshAuth();
        
        toast({
          title: "Battle.net account connected",
          description: "Your Battle.net account has been connected successfully",
        });
        
        return true;
      } else {
        toast({
          title: "Connection failed",
          description: response.data.message || 'Failed to connect Battle.net account',
          variant: "destructive"
        });
        return false;
      }
    } catch (error: any) {
      console.error('Connect Battle.net error:', error);
      
      toast({
        title: "Connection failed",
        description: error.response?.data?.message || error.message || 'An error occurred while connecting your Battle.net account',
        variant: "destructive"
      });
      
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        error: error as Error,
        loginMutation,
        logoutMutation,
        refreshAuth,
        refreshUserCharacters,
        characters,
        mainCharacter,
        directLogin,
        setMainCharacterMutation,
        linkCharacterMutation,
        logout,
        login,
        register,
        connectBattleNet
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use the auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}