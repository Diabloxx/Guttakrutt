import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LogIn, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function LoginTestPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string>('');
  const [authResponse, setAuthResponse] = useState<any>(null);
  
  // Test direct HTTP request to Battle.net auth endpoint
  const testDirectAuth = async () => {
    try {
      setStatus('loading');
      setMessage('Testing direct HTTP request to /api/auth/user...');
      
      // Use explicit headers and credentials
      const response = await fetch('/api/auth/user', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Log full response info for debugging
      console.log('Response status:', response.status);
      
      // Log headers individually to avoid iterator issues
      console.log('Response headers:');
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      // Get text first so we can debug if it's not valid JSON
      const text = await response.text();
      console.log('Raw response text:', text);
      
      // Try to parse as JSON
      let data;
      try {
        // Special handling for empty responses
        if (!text || text.trim() === '') {
          data = { message: 'Empty response received' };
        } else {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Create a safe fallback object with error information
        data = { 
          error: true, 
          message: 'Failed to parse JSON response',
          rawResponse: text.length > 100 ? text.substring(0, 100) + '...' : text
        };
      }
      
      setAuthResponse(data);
      console.log('Auth user response:', data);
      
      setStatus('success');
      setMessage('Auth check completed successfully. See the response below.');
    } catch (error) {
      console.error('Auth test failed:', error);
      setStatus('error');
      setMessage(`Authentication test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Test full OAuth flow with window.location
  const testOAuthFlow = () => {
    setStatus('loading');
    setMessage('Redirecting to Battle.net login...');
    
    // Log the URL we're redirecting to
    console.log('Redirecting to:', '/api/auth/bnet');
    
    // Redirect to the authentication endpoint
    window.location.href = '/api/auth/bnet';
  };
  
  // Test manual redirect approach
  const testManualRedirect = () => {
    setStatus('loading');
    setMessage('Using alternative redirect method...');
    
    console.log('Using direct Battle.net auth endpoint');
    window.location.href = '/api/auth/bnet-direct';
  };
  
  // Test viewing auth configuration
  const viewAuthConfig = async () => {
    try {
      setStatus('loading');
      setMessage('Checking Battle.net auth configuration...');
      
      // Use explicit headers and credentials
      const response = await fetch('/api/auth/bnet-config', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      // Log full response info for debugging
      console.log('Response status:', response.status);
      
      // Log headers individually to avoid iterator issues
      console.log('Response headers:');
      response.headers.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
      
      // Get text first so we can debug if it's not valid JSON
      const text = await response.text();
      console.log('Raw config response text:', text);
      
      // Try to parse as JSON
      let data;
      try {
        // Special handling for empty responses
        if (!text || text.trim() === '') {
          data = { message: 'Empty response received' };
        } else {
          data = JSON.parse(text);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Create a safe fallback object with error information
        data = { 
          error: true, 
          message: 'Failed to parse JSON response',
          rawResponse: text.length > 100 ? text.substring(0, 100) + '...' : text
        };
      }
      
      setAuthResponse(data);
      console.log('Auth configuration:', data);
      
      setStatus('success');
      setMessage('Auth configuration retrieved successfully');
    } catch (error) {
      console.error('Failed to get auth config:', error);
      setStatus('error');
      setMessage(`Failed to get auth configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Test server debug endpoint (using XMLHttpRequest for better compatibility)
  const testServerDebug = async () => {
    try {
      setStatus('loading');
      setMessage('Checking server debug endpoint...');
      
      // Create a Promise that wraps XMLHttpRequest for better browser compatibility
      const apiPromise = new Promise<any>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        // Use a timestamp query parameter to avoid cache issues
        xhr.open('GET', `/api/auth-debug?t=${Date.now()}`, true);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.withCredentials = true;
        
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('Debug endpoint raw response:', xhr.responseText);
            try {
              if (!xhr.responseText || xhr.responseText.trim() === '') {
                resolve({ message: 'Empty response received' });
              } else {
                resolve(JSON.parse(xhr.responseText));
              }
            } catch (parseError) {
              console.error('JSON parse error:', parseError);
              resolve({ 
                error: true, 
                message: 'Failed to parse JSON response',
                rawResponse: xhr.responseText.length > 100 
                  ? xhr.responseText.substring(0, 100) + '...' 
                  : xhr.responseText
              });
            }
          } else {
            reject(new Error(`Server error: ${xhr.status}`));
          }
        };
        
        xhr.onerror = () => {
          reject(new Error('Network error while connecting to server'));
        };
        
        xhr.send();
      });
      
      // Wait for the request to complete
      const data = await apiPromise;
      
      setAuthResponse(data);
      console.log('Server debug response:', data);
      
      setStatus('success');
      setMessage('Debug check completed successfully. See the response below.');
    } catch (error) {
      console.error('Debug check failed:', error);
      setStatus('error');
      setMessage(`Debug check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  // Test using JSONP approach (avoids CORS issues)
  const testJsonp = () => {
    try {
      setStatus('loading');
      setMessage('Testing JSONP approach...');
      
      // Create a unique callback name
      const callbackName = 'jsonpCallback_' + Date.now();
      
      // Create the callback function on the window object
      (window as any)[callbackName] = (data: any) => {
        console.log('JSONP response received:', data);
        setAuthResponse(data);
        setStatus('success');
        setMessage('JSONP check completed successfully. See the response below.');
        
        // Clean up the global callback to avoid memory leaks
        delete (window as any)[callbackName];
        document.head.removeChild(script);
      };
      
      // Create and append the script element
      const script = document.createElement('script');
      script.src = `/api/auth-debug-jsonp?callback=${callbackName}&t=${Date.now()}`;
      document.head.appendChild(script);
      
      // Set a timeout to handle if the script fails to load
      setTimeout(() => {
        if (document.head.contains(script)) {
          setStatus('error');
          setMessage('JSONP request timed out after 5 seconds');
          document.head.removeChild(script);
          delete (window as any)[callbackName];
        }
      }, 5000);
    } catch (error) {
      console.error('JSONP check failed:', error);
      setStatus('error');
      setMessage(`JSONP check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };
  
  return (
    <div className="container py-10 px-4 mx-auto flex flex-col items-center justify-center">
      <Card className="max-w-lg w-full bg-wow-dark border-wow-green/30">
        <CardHeader>
          <CardTitle className="text-2xl text-wow-green">Battle.net Authentication Test</CardTitle>
          <CardDescription className="text-wow-light/70">
            Use this page to test the Battle.net authentication flow
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
          
          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button 
                variant="outline" 
                className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                onClick={testDirectAuth}
                disabled={status === 'loading'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Auth Status
              </Button>
              
              <Button 
                variant="outline" 
                className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                onClick={viewAuthConfig}
                disabled={status === 'loading'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                View Auth Config
              </Button>
              
              <Button 
                variant="outline" 
                className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                onClick={testServerDebug}
                disabled={status === 'loading'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Debug Server
              </Button>
              
              <Button 
                variant="outline" 
                className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                onClick={testJsonp}
                disabled={status === 'loading'}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                JSONP Test
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a href="/api/auth/bnet" target="_self">
                <Button 
                  className="w-full bg-wow-green text-black hover:bg-wow-green/90"
                  disabled={status === 'loading'}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Standard Login
                </Button>
              </a>
              
              <a href="/api/auth/bnet-direct" target="_self">
                <Button 
                  className="w-full bg-wow-gold text-black hover:bg-wow-gold/90"
                  disabled={status === 'loading'}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Direct Method
                </Button>
              </a>
            </div>
          </div>
          
          {authResponse && (
            <div className="mt-6">
              <h3 className="text-wow-green font-medium mb-2">Auth Response:</h3>
              <pre className="bg-wow-dark/50 border border-wow-green/30 rounded-md p-4 overflow-auto text-sm text-wow-light/90 max-h-48">
                {JSON.stringify(authResponse, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between border-t border-wow-green/30 pt-4">
          <Button 
            variant="link" 
            className="text-wow-light hover:text-wow-green"
            onClick={() => window.location.href = '/'}
          >
            Return to Home
          </Button>
          
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
            Reset Test
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}