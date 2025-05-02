/**
 * API Routes utility
 * 
 * This module provides helper functions to handle differences in API routes between
 * development and production environments. In development, API routes work normally
 * with the /api prefix, but in production, some routes may need different paths.
 * 
 * MySQL production environment also has different routing patterns that we need to handle.
 */

// Determine if we're in production by checking if the hostname isn't localhost
// This is a simple heuristic, but works for our needs
export const isProduction = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !window.location.hostname.includes('localhost') && 
         !window.location.hostname.includes('127.0.0.1');
};

// Check if we're on the specific production domain that uses MySQL
// or if the simulation mode is enabled
export const isGuttakruttOrg = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // First check if we're in test simulation mode
  // This allows our test page to override this function
  if (typeof (window as any).isGuttakruttOrgOverride === 'function') {
    console.log('Using isGuttakruttOrgOverride from test environment');
    return (window as any).isGuttakruttOrgOverride();
  }
  
  // Otherwise check the actual hostname
  return window.location.hostname.includes('guttakrutt.org');
};

// Routes that need special handling in production
// We're keeping the /api prefix for local development but translating to .php for guttakrutt.org
const SPECIAL_ROUTES: Record<string, string> = {
  // Auth routes - for MySQL production environment, we need different paths
  '/api/auth/status': '/auth-status.php',
  '/api/auth/bnet': '/auth-bnet.php',
  '/api/auth/bnet/callback': '/auth-callback.php',
  '/api/auth/bnet-direct': '/auth-bnet-direct.php',
  '/api/auth/logout': '/auth-logout.php',
  '/api/auth/user': '/auth-user.php',
  '/api/auth/my-characters': '/auth-characters.php',
};

/**
 * Get the appropriate route for the current environment
 * In development, this returns the standard route with /api prefix
 * In production, it may return an alternative route for certain paths
 * 
 * @param route The standard API route (with /api prefix)
 * @returns The environment-appropriate route
 */
export const getApiRoute = (route: string): string => {
  // Add timestamp to prevent caching
  const timestamp = `${route.includes('?') ? '&' : '?'}t=${Date.now()}`;
  
  // In guttakrutt.org (MySQL production), we need to use PHP endpoints
  if (isGuttakruttOrg() && SPECIAL_ROUTES[route]) {
    console.log(`Using guttakrutt.org route for ${route}: ${SPECIAL_ROUTES[route]}`);
    return `${SPECIAL_ROUTES[route]}${timestamp}`;
  }
  
  // In general production environments, check if this route needs special handling
  if (isProduction() && SPECIAL_ROUTES[route] && !isGuttakruttOrg()) {
    console.log(`Using production route for ${route}: ${SPECIAL_ROUTES[route]}`);
    return `${SPECIAL_ROUTES[route]}${timestamp}`;
  }
  
  // In development, or for normal routes in production, use the standard route
  return `${route}${timestamp}`;
};

/**
 * Make a fetch request to an API route using the appropriate path for the environment
 * 
 * @param route The standard API route (with /api prefix)
 * @param options Fetch options
 * @returns The fetch Promise
 */
export const fetchApiRoute = async (
  route: string, 
  options: RequestInit = {}
): Promise<Response> => {
  // Handle specific guttakrutt.org case directly for character data
  if (isGuttakruttOrg() && route === '/api/auth/my-characters') {
    const directPhpUrl = `/auth-characters.php?t=${Date.now()}`;
    console.log(`[DIRECT PHP] Using direct PHP URL for characters on guttakrutt.org: ${directPhpUrl}`);

    const fetchOptions: RequestInit = {
      credentials: 'include',
      ...options,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    };

    try {
      // Direct fetch from PHP endpoint
      return await fetch(directPhpUrl, fetchOptions);
    } catch (error) {
      console.error(`[DIRECT PHP] Error fetching ${directPhpUrl}:`, error);
      throw error;
    }
  }
  
  // For all other routes...
  const apiRoute = getApiRoute(route);
  
  console.log(`Fetching from: ${apiRoute}`);
  
  // Always include credentials for auth routes
  const fetchOptions: RequestInit = {
    credentials: 'include',
    ...options,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  };
  
  try {
    console.log(`[API] Making request to: ${apiRoute} with options:`, {
      method: options.method || 'GET',
      credentials: 'include',
      headers: {
        accept: 'application/json',
        contentType: 'application/json'
      }
    });
    
    // First attempt with our computed route
    const response = await fetch(apiRoute, fetchOptions);
    console.log(`[API] Response status: ${response.status} for ${apiRoute}`);
    
    // For debugging, check if the response is actually JSON
    try {
      // Only clone and check response if it's not ok (to debug issues)
      if (!response.ok) {
        const clonedResponse = response.clone();
        const text = await clonedResponse.text();
        console.log(`[API] Response text (first 100 chars): ${text.substring(0, 100)}`);
        
        // Check if we got HTML instead of JSON
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          console.error('[API] Received HTML instead of JSON - server error');
          throw new Error('Received HTML instead of JSON - server error');
        }
      }
    } catch (debugError) {
      console.error('[API] Error while debugging response:', debugError);
    }
    
    // For guttakrutt.org (MySQL), we have specific PHP endpoints
    if (response.status === 404 && isGuttakruttOrg() && route.includes('/auth/')) {
      console.log(`Auth route ${apiRoute} returned 404 on guttakrutt.org, trying PHP endpoint`);
      
      // Get the auth endpoint name
      const authEndpoint = route.split('/').pop();
      const phpEndpoint = `/auth-${authEndpoint}.php?t=${Date.now()}`;
      console.log(`Trying MySQL PHP endpoint: ${phpEndpoint}`);
      
      return await fetch(phpEndpoint, fetchOptions);
    }
    
    // For other production environments
    if (response.status === 404 && isProduction() && !route.startsWith('/auth/') && !isGuttakruttOrg()) {
      console.log(`Primary route ${apiRoute} returned 404, trying alternative path`);
      
      // Try alternative path format
      const altRoute = route.replace('/api/', '/');
      console.log(`Trying alternative route: ${altRoute}`);
      
      return await fetch(`${altRoute}${route.includes('?') ? '&' : '?'}t=${Date.now()}`, fetchOptions);
    }
    
    return response;
  } catch (error) {
    console.error(`Error fetching ${apiRoute}:`, error);
    throw error;
  }
};

/**
 * Redirect to an API route (for auth flows)
 * 
 * @param route The standard API route (with /api prefix)
 */
export const redirectToApiRoute = (route: string): void => {
  // Enhanced debugging for redirect operations
  console.log(`Handling route redirection for: ${route}`);
  console.log(`Environment detection: isProduction=${isProduction()}, isGuttakruttOrg=${isGuttakruttOrg()}`);
  
  // Special handling for Battle.net auth routes
  if (route.includes('/api/auth/bnet')) {
    if (isGuttakruttOrg()) {
      // Handle special PHP endpoints for guttakrutt.org domain
      if (route.includes('bnet-direct')) {
        const redirectUrl = `/auth-bnet-direct.php?t=${Date.now()}`;
        console.log(`[PHP Mode] Redirecting to PHP endpoint for bnet-direct: ${redirectUrl}`);
        window.location.href = redirectUrl;
      } else if (route.includes('callback')) {
        const redirectUrl = `/auth-callback.php?t=${Date.now()}`;
        console.log(`[PHP Mode] Redirecting to PHP endpoint for callback: ${redirectUrl}`);
        window.location.href = redirectUrl;
      } else {
        const redirectUrl = `/auth-bnet.php?t=${Date.now()}`;
        console.log(`[PHP Mode] Redirecting to PHP endpoint for bnet: ${redirectUrl}`);
        window.location.href = redirectUrl;
      }
    } else if (route === '/api/auth/bnet') {
      // For standard Battle.net login on other environments
      const redirectUrl = `/api/auth/bnet?t=${Date.now()}`;
      console.log(`[Standard Mode] Redirecting to Battle.net auth endpoint: ${redirectUrl}`);
      window.location.href = redirectUrl;
    } else {
      // For other auth routes (callback, etc.)
      const redirectUrl = `${route}?t=${Date.now()}`;
      console.log(`[Standard Mode] Redirecting to API route: ${redirectUrl}`);
      window.location.href = redirectUrl;
    }
    console.log('Auth redirect completed');
    return;
  }
  
  // For all other auth routes that aren't Battle.net specific
  if (route.includes('/api/auth/')) {
    if (isGuttakruttOrg()) {
      // Extract just the endpoint name (last part of the path)
      const authEndpoint = route.split('/').pop() || '';
      const phpEndpoint = `/auth-${authEndpoint}.php?t=${Date.now()}`;
      console.log(`[PHP Mode] Redirecting to PHP endpoint: ${phpEndpoint}`);
      window.location.href = phpEndpoint;
      console.log('Auth redirect completed');
      return;
    }
  }
  
  // For all other routes, just use the standard route handling
  const apiRoute = getApiRoute(route);
  console.log(`[Standard Mode] Redirecting to standard API route: ${apiRoute}`);
  window.location.href = apiRoute;
  console.log('Standard redirect completed');
};

export default {
  isProduction,
  getApiRoute,
  fetchApiRoute,
  redirectToApiRoute
};