import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * Helper function to convert API paths to PHP simulation paths on production
 * This is critical for proper operation on guttakrutt.org
 */
export function getProperEndpoint(endpoint: string): string {
  // Check if we're on guttakrutt.org production environment
  const isGuttakruttOrg = window.location.hostname.includes('guttakrutt.org');
  
  if (!isGuttakruttOrg) {
    // In development, use the original API endpoint
    return endpoint;
  }
  
  console.log(`Converting endpoint for production: ${endpoint}`);
  
  // Normalize the endpoint by removing any query parameters for comparison
  // but preserve them for the returned URL
  const [baseEndpoint, queryParams] = endpoint.split('?');
  const queryString = queryParams ? `?${queryParams}` : '';
  
  // Convert API endpoints to direct PHP simulation endpoints
  // Match in the order of most specific to least specific
  
  // User auth status endpoint
  if (baseEndpoint === '/api/auth/user' || baseEndpoint === '/api/auth/user/') {
    return `/auth-user.php${queryString}`;
  } 
  // Character endpoints - all variations
  else if (
    baseEndpoint === '/api/auth/my-characters' || 
    baseEndpoint === '/api/auth/my-characters/' ||
    baseEndpoint === '/api/characters' || 
    baseEndpoint === '/api/characters/' ||
    baseEndpoint === '/api/characters/fetch-bnet-characters' ||
    baseEndpoint.includes('/api/characters/')
  ) {
    return `/auth-characters.php${queryString}`; 
  } 
  // Auth status check endpoint
  else if (baseEndpoint === '/api/auth/status' || baseEndpoint === '/api/auth/status/') {
    return `/auth-status.php${queryString}`;
  } 
  // Logout endpoint
  else if (baseEndpoint === '/api/auth/logout' || baseEndpoint === '/api/auth/logout/') {
    return `/auth-logout.php${queryString}`;
  } 
  // Battle.net auth endpoint - this needs to be more flexible
  else if (
    baseEndpoint === '/api/auth/bnet' || 
    baseEndpoint === '/api/auth/bnet/' || 
    baseEndpoint.includes('/api/auth/bnet')
  ) {
    // Preserve any query parameters that were appended
    return `/auth-bnet.php${queryString}`;
  }
  // Direct auth endpoints
  else if (baseEndpoint === '/api/direct/login' || baseEndpoint.includes('/api/direct/login')) {
    return `/direct-login.php${queryString}`;
  }
  else if (baseEndpoint === '/api/direct/logout' || baseEndpoint.includes('/api/direct/logout')) {
    return `/direct-logout.php${queryString}`;
  }
  // Direct auth check endpoint (used in profile.tsx to verify login status)
  else if (baseEndpoint === '/api/auth/direct-check' || baseEndpoint.includes('/api/auth/direct-check')) {
    return `/auth-direct-check.php${queryString}`;
  }
  // Windows auth endpoints
  else if (baseEndpoint === '/windows-auth/login' || baseEndpoint.includes('/windows-auth/login')) {
    // Keep as is - these are special local endpoints
    return endpoint;
  }
  
  // For other endpoints, keep them as they are
  return endpoint;
}

/**
 * Helper function to safely parse JSON response that might contain HTML error pages
 * This helps especially with Windows/MySQL environments where PHP endpoints might return HTML
 */
export async function safeJsonParse(response: Response): Promise<any> {
  try {
    // Get the response text to check for problems
    const responseText = await response.text();
    
    // Check if the response contains HTML (likely an error page)
    if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
      console.error('Received HTML instead of JSON:', responseText.substring(0, 200));
      
      // Get the URL and status for better debugging
      const url = response.url;
      const status = response.status;
      console.error(`HTML response detected for ${url} with status ${status}`);
      
      // For auth endpoints, handle more gracefully with empty defaults
      // This includes BOTH /api/auth/user and /api/auth/user endpoints (with/without trailing slash)
      const isAuthEndpoint = url.includes('/auth/') || url.includes('/api/auth') || 
                            url.includes('/auth-user.php') || url.includes('/auth-status.php');
      if (isAuthEndpoint) {
        // If we get an HTML redirect for auth, it often means we're not logged in
        console.warn(`Auth endpoint ${url} returned HTML - treating as unauthenticated`);
        console.warn(`HTML Content (first 100 chars): ${responseText.substring(0, 100)}`);
        
        // Specifically detect guttakrutt.org production environment
        const isProduction = url.includes('guttakrutt.org');
        if (isProduction) {
          console.log('Production environment detected, using special HTML handling');
        }
        
        // Check if the HTML might actually contain authentication success indicators
        const mightBeLoggedIn = responseText.includes('logged in') || 
                               responseText.includes('authenticated') ||
                               responseText.includes('successful') ||
                               responseText.includes('welcome back') ||
                               responseText.includes('Session saved successfully') ||
                               responseText.includes('Battle.net');
                               
        if (mightBeLoggedIn) {
          console.log("Found logged in indicators in HTML - user might be authenticated");
          
          // Attempt to extract user information from HTML if available
          let extractedUser = null;
          try {
            // Try to find JSON data in the HTML response using regex
            const jsonMatch = responseText.match(/{[\s\S]*}/);
            if (jsonMatch) {
              const jsonData = JSON.parse(jsonMatch[0]);
              if (jsonData.user || jsonData.id || jsonData.battleTag) {
                extractedUser = jsonData;
                console.log("Successfully extracted user data from HTML response", extractedUser);
              }
            }
          } catch (e) {
            console.log("Could not extract user data from HTML:", e);
          }
          
          // Create an authenticated response with whatever user data we found
          return {
            authenticated: true,
            user: extractedUser || {
              id: 1, // Placeholder
              battleNetId: "unknown",
              battleTag: "Unknown#0000", 
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            },
            debug: {
              htmlDetected: true,
              extractedData: !!extractedUser,
              url: url,
              status: status,
              timestamp: new Date().toISOString(),
              isProduction: isProduction,
              source: 'safeJsonParse - HTML with auth indicators detected'
            }
          };
        }
        
        // Handle different auth endpoint types with appropriate responses
        if (url.includes('user') || url.includes('status') || 
            url.endsWith('/auth/user') || url.includes('auth-user.php')) {
          // Default auth response for user or status endpoints
          return { 
            authenticated: false, 
            user: null,
            debug: {
              htmlDetected: true,
              url: url,
              status: status,
              timestamp: new Date().toISOString(),
              isProduction: isProduction,
              source: 'safeJsonParse - HTML detected'
            }
          };
        } else if (url.includes('characters') || url.includes('auth-characters.php')) {
          // Default characters response with debug information
          return { 
            success: false, 
            characters: [], 
            count: 0,
            debug: {
              source: 'safeJsonParse',
              error: 'HTML detected instead of JSON',
              htmlDetected: true,
              url: url,
              status: status
            }
          };
        }
      }
      
      // For MySQL environments with PHP endpoints, specifically look for login redirects
      if (responseText.includes('login') && responseText.includes('redirect')) {
        console.warn('Detected login redirect page - treating as auth failure');
        return { 
          authenticated: false, 
          user: null,
          redirected: true,
          debug: { 
            htmlDetected: true,
            message: 'Login redirect detected',
            url: url,
            status: status
          }
        };
      }
      
      // Check for Battle.net auth failure patterns specifically error pages
      if ((responseText.includes('battle.net') || 
          responseText.includes('oauth') || 
          responseText.includes('Authentication failed')) && 
          responseText.includes('error')) {
        console.warn('Detected Battle.net auth failure page - treating as auth failure');
        return { 
          authenticated: false, 
          user: null, 
          bnetError: true,
          debug: { 
            htmlDetected: true,
            message: 'Battle.net authentication error detected',
            url: url,
            status: status
          }
        };
      }
      
      // For other endpoints, throw error to be caught by error handling
      throw new Error(`Received HTML instead of JSON for ${url} (status ${status})`);
    }
    
    // If it's empty, return null
    if (responseText.trim() === '') {
      console.warn('Empty response received');
      return null;
    }
    
    // If we got here, it should be valid JSON
    try {
      return JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON:', responseText.substring(0, 100) + '...');
      throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  } catch (error) {
    console.error('Error parsing response:', error);
    throw new Error(`Failed to parse response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorText;
    try {
      // Try to parse as JSON first using our safer parse function
      const clonedRes = res.clone();
      const errorJson = await safeJsonParse(clonedRes);
      errorText = errorJson.message || errorJson.error || JSON.stringify(errorJson);
    } catch (e) {
      // If not JSON, get as text
      try {
        errorText = await res.text();
      } catch (e2) {
        errorText = res.statusText;
      }
    }
    
    const error = new Error(`${res.status}: ${errorText}`);
    console.error(`API Error: ${error.message}`);
    throw error;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Use our helper function to get the proper endpoint for the environment
  const properUrl = getProperEndpoint(url);
  
  // Log if we modified the URL for guttakrutt.org
  if (properUrl !== url) {
    console.log(`API request URL converted: ${url} -> ${properUrl}`);
  }
  
  const res = await fetch(properUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Use our helper function to get the proper endpoint based on environment
    const endpoint = queryKey[0] as string;
    const properEndpoint = getProperEndpoint(endpoint);
    
    // Log if we modified the URL for guttakrutt.org
    if (properEndpoint !== endpoint) {
      console.log(`Query URL converted: ${endpoint} -> ${properEndpoint}`);
    }
    
    const res = await fetch(properEndpoint, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    // Use our safe JSON parser instead of the standard json() method
    return await safeJsonParse(res.clone());
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
