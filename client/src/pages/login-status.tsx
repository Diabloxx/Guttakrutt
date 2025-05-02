import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, RefreshCw, LogIn, Share2 } from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { fetchApiRoute, redirectToApiRoute } from '@/lib/api-routes';

export default function LoginStatusPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [authResponse, setAuthResponse] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [directMode, setDirectMode] = useState(true);
  
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Test authentication status via direct form submission
  const checkAuthStatus = async () => {
    try {
      setStatus('loading');
      setMessage('Checking authentication status...');
      
      if (directMode) {
        // Create a form and submit it directly - use our API route utility to get the right path
        const form = document.createElement('form');
        form.method = 'get';
        // Import the function from the api-routes utility
        const apiRoute = '/api/auth/status';
        // Use absolute URL to avoid Vite routing issues
        form.action = window.location.origin + apiRoute.split('?')[0]; // Remove query params
        form.target = 'api-response-frame';
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
        
        // The response will be handled by the iframe's load event
        setMessage('Request sent via form submission. Check the iframe response below.');
      } else {
        // Use our API routes utility for better environment handling
        try {
          // Use our fetchApiRoute utility which handles environment differences
          const response = await fetchApiRoute('/api/auth/status');
          
          // Extract the response text
          const responseText = await response.text();
          console.log('Auth status raw response:', responseText);
          
          // Process the response text
          let data;
          try {
            // Only try to parse as JSON if it starts with {
            if (responseText.trim().startsWith('{')) {
              data = JSON.parse(responseText);
            } else {
              throw new Error('Response is not valid JSON');
            }
          } catch (parseError: any) {
            console.error('JSON parse error:', parseError);
            throw new Error(`Failed to parse JSON: ${parseError.message}`);
          }
          
          setAuthResponse(data);
          setIsAuthenticated(data.authInfo?.isAuthenticated === true);
          
          setStatus('success');
          setMessage(data.authInfo?.isAuthenticated 
            ? 'You are currently logged in.' 
            : 'You are not currently logged in.');
        } catch (fetchError: any) {
          console.error('Fetch error:', fetchError);
          throw fetchError;
        }
      }
    } catch (error: any) {
      console.error('Failed to check auth status:', error);
      setStatus('error');
      setMessage(`Failed to check authentication status: ${error.message || String(error)}`);
    }
  };
  
  // Handle iframe load event
  const handleIframeLoad = (event: React.SyntheticEvent<HTMLIFrameElement>) => {
    try {
      const iframe = event.currentTarget;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument) {
        console.error('Cannot access iframe document');
        setStatus('error');
        setMessage('Cannot access iframe document - possibly due to same-origin policy');
        return;
      }
      
      const content = iframeDocument.body.textContent || '';
      console.log('Iframe content:', content);
      
      try {
        if (content && content.trim() !== '') {
          const trimmedContent = content.trim();
          
          // Check if the response looks like HTML instead of JSON
          if (trimmedContent.startsWith('<')) {
            console.error('Received HTML instead of JSON in iframe:', trimmedContent);
            setStatus('error');
            setMessage('Received HTML instead of JSON - the server might be returning an error page');
            setAuthResponse({ 
              error: true,
              message: 'Received HTML instead of JSON',
              rawContent: trimmedContent.length > 200 ? trimmedContent.substring(0, 200) + '...' : trimmedContent
            });
            return;
          }
        
          const data = JSON.parse(trimmedContent);
          setAuthResponse(data);
          
          // Check auth status from the enhanced endpoint structure
          const isAuth = data.authInfo?.isAuthenticated === true;
          setIsAuthenticated(isAuth);
          
          setStatus('success');
          setMessage(isAuth 
            ? `You are currently logged in as ${data.authInfo?.user?.battleTag || 'unknown user'}` 
            : 'You are not currently logged in.');
            
          // Add more information if available
          if (isAuth && data.authInfo?.user?.tokenExpiryDate) {
            const tokenExpiry = new Date(data.authInfo.user.tokenExpiryDate);
            const isExpired = data.authInfo.user.isTokenExpired;
            
            if (isExpired) {
              setMessage(prev => `${prev} (Warning: Your access token is expired)`);
            } else {
              setMessage(prev => `${prev} (Token valid until ${tokenExpiry.toLocaleString()})`);
            }
          }
        } else {
          setStatus('error');
          setMessage('Empty response received from the server');
        }
      } catch (parseError: any) {
        console.error('JSON parse error:', parseError);
        setStatus('error');
        setMessage(`Failed to parse JSON response: ${parseError.message || String(parseError)}`);
        setAuthResponse({ 
          error: true,
          message: `Failed to parse JSON response: ${parseError.message || String(parseError)}`,
          rawContent: content.length > 150 ? content.substring(0, 150) + '...' : content
        });
      }
    } catch (error: any) {
      console.error('Error handling iframe load:', error);
      setStatus('error');
      setMessage(`Error handling iframe response: ${error.message || String(error)}`);
    }
  };
  
  // Direct login via a full page redirect (most reliable)
  const directLogin = () => {
    // Use the redirectToApiRoute utility for proper environment-specific path
    redirectToApiRoute('/api/auth/bnet');
  };
  
  // Manual redirect login via the redirect-test.ts route
  const manualLogin = () => {
    // Use the redirectToApiRoute utility for proper environment-specific path
    redirectToApiRoute('/api/auth/bnet-direct');
  };
  
  // Logout via a full page redirect
  const logout = () => {
    // Use the redirectToApiRoute utility for proper environment-specific path
    redirectToApiRoute('/api/auth/logout');
  };
  
  return (
    <div className="container py-10 px-4 mx-auto flex flex-col items-center justify-center">
      <Card className="max-w-xl w-full bg-wow-dark border-wow-green/30">
        <CardHeader>
          <CardTitle className="text-2xl text-wow-green">
            {isAuthenticated
              ? "Battle.net Authentication Status: Logged In"
              : "Battle.net Authentication Status: Not Logged In"}
          </CardTitle>
          <CardDescription className="text-wow-light/70">
            Use this page to check your Battle.net authentication status and login/logout
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === 'loading' && (
            <div className="flex items-center space-x-2 p-3 border border-wow-green/30 rounded-md bg-wow-green/5">
              <RefreshCw className="h-5 w-5 text-wow-green animate-spin" />
              <span className="text-wow-light">{message}</span>
            </div>
          )}
          
          {status === 'success' && (
            <Alert className="border-green-500/30 bg-green-500/5">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <AlertTitle className="text-green-500">Success</AlertTitle>
              <AlertDescription className="text-wow-light">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          {status === 'error' && (
            <Alert className="border-red-500/30 bg-red-500/5">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <AlertTitle className="text-red-500">Error</AlertTitle>
              <AlertDescription className="text-wow-light">
                {message}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col space-y-4">
            {/* Authentication Action Buttons */}
            <div className="grid grid-cols-1 gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                  onClick={checkAuthStatus}
                  disabled={status === 'loading'}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Check Auth Status
                </Button>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="direct-mode"
                    className="rounded border-wow-green/30 text-wow-green"
                    checked={directMode}
                    onChange={() => setDirectMode(!directMode)}
                  />
                  <label htmlFor="direct-mode" className="text-wow-light text-sm">
                    Use direct form submission
                  </label>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!isAuthenticated ? (
                  <>
                    <Button 
                      className="w-full bg-wow-green text-black hover:bg-wow-green/90"
                      onClick={directLogin}
                      disabled={status === 'loading'}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Login with Battle.net
                    </Button>
                    
                    <Button 
                      className="w-full bg-wow-gold text-black hover:bg-wow-gold/90"
                      onClick={manualLogin}
                      disabled={status === 'loading'}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Manual Redirect Login
                    </Button>
                  </>
                ) : (
                  <Button 
                    className="w-full bg-red-500 text-white hover:bg-red-600"
                    onClick={logout}
                    disabled={status === 'loading'}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                )}
              </div>
            </div>
            
            {/* Response Data */}
            {authResponse && (
              <div className="mt-4">
                <h3 className="text-wow-green font-medium mb-2">Response Data:</h3>
                <pre className="bg-wow-dark/50 border border-wow-green/30 rounded-md p-4 overflow-auto text-sm text-wow-light/90 max-h-48">
                  {JSON.stringify(authResponse, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Hidden iframe for form responses */}
            {directMode && (
              <div className="mt-4">
                <h3 className="text-wow-green font-medium mb-2">Direct Response:</h3>
                <div className="border border-wow-green/30 rounded-md bg-wow-dark/50 p-1 h-40">
                  <iframe 
                    name="api-response-frame" 
                    className="w-full h-full bg-transparent"
                    onLoad={handleIframeLoad}
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 border-t border-wow-green/30 pt-4">
          <div className="flex space-x-4">
            <Button 
              variant="link" 
              className="text-wow-light hover:text-wow-green"
              onClick={() => window.location.href = '/'}
            >
              Return to Home
            </Button>
            
            <Button 
              variant="link" 
              className="text-amber-500 hover:text-amber-400"
              onClick={() => window.location.href = '/guttakrutt-test'}
            >
              Test guttakrutt.org Routes
            </Button>
          </div>
          
          <Button 
            variant="outline" 
            className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
            onClick={() => {
              setStatus('idle');
              setMessage('');
              setAuthResponse(null);
            }}
            disabled={status === 'loading'}
          >
            Reset Status
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}