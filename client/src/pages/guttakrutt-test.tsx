import React, { useState, useEffect } from 'react';
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
import { Code } from '@/components/ui/code';
import { fetchApiRoute, redirectToApiRoute, isGuttakruttOrg } from '@/lib/api-routes';
import { Link } from 'wouter';

/**
 * Testing environment for guttakrutt.org domain
 * This page allows testing our API routing logic by simulating the guttakrutt.org domain
 */
export default function GuttakruttTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [mockProduction, setMockProduction] = useState(false);

  // Override the isGuttakruttOrg function for testing
  useEffect(() => {
    // Define our override function that will be accessible globally
    const overrideIsGuttakruttOrg = () => mockProduction;
    
    // Directly assign to window object to make it visible to the imported isGuttakruttOrg function
    (window as any).isGuttakruttOrgOverride = overrideIsGuttakruttOrg;
    
    // Log the override for debugging
    console.log(`[Test Environment] Setting guttakrutt.org simulation mode to: ${mockProduction}`);
    console.log(`[Test Environment] Window has isGuttakruttOrgOverride: ${!!(window as any).isGuttakruttOrgOverride}`);
    
    return () => {
      // Clean up by removing our override function
      delete (window as any).isGuttakruttOrgOverride;
      console.log('[Test Environment] Removed guttakrutt.org simulation override');
    };
  }, [mockProduction]);

  // Run a test on a specific API route
  const testRoute = async (route: string) => {
    try {
      setTestResults(prev => [...prev, { 
        route, 
        status: 'running',
        message: `Testing route: ${route}...`,
        result: null,
        error: null 
      }]);
      
      // Calculate what the route would be transformed into
      let computedRoute = '';
      
      try {
        // Skip the actual fetch, just compute what route we'd use
        if (mockProduction) {
          // If auth route and in production mode
          if (route.includes('/auth/')) {
            const authEndpoint = route.split('/').pop() || '';
            computedRoute = `/auth-${authEndpoint}.php`;
          } else {
            computedRoute = route.replace('/api/', '/');
          }
        } else {
          // In dev mode, we'd use the standard route
          computedRoute = route;
        }
      } catch (error: any) {
        setTestResults(prev => 
          prev.map(item => 
            item.route === route 
            ? { 
                ...item, 
                status: 'error',
                message: `Error computing route: ${error.message}`,
                error: error
              } 
            : item
          )
        );
        return;
      }
      
      setTestResults(prev => 
        prev.map(item => 
          item.route === route 
          ? { 
              ...item, 
              status: 'success',
              message: `Route ${route} would transform to: ${computedRoute}`,
              result: { computedRoute }
            } 
          : item
        )
      );
    } catch (error: any) {
      setTestResults(prev => 
        prev.map(item => 
          item.route === route 
          ? { 
              ...item, 
              status: 'error',
              message: `Test failed: ${error.message}`,
              error: error
            } 
          : item
        )
      );
    }
  };

  // Clear all test results
  const clearTests = () => {
    setTestResults([]);
  };

  // Direct test of a PHP endpoint
  const testPhpEndpoint = async (endpoint: string) => {
    try {
      setTestResults(prev => [...prev, { 
        route: endpoint, 
        status: 'running',
        message: `Testing PHP endpoint directly: ${endpoint}...`,
        result: null,
        error: null 
      }]);
      
      // Make a direct request to the PHP endpoint
      const url = `${endpoint}?t=${Date.now()}`;
      console.log(`Testing PHP endpoint directly: ${url}`);
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      const isJson = response.headers.get('content-type')?.includes('application/json');
      let responseData;
      
      if (isJson) {
        try {
          responseData = await response.json();
        } catch (e) {
          console.error('Failed to parse JSON', e);
          const text = await response.text();
          responseData = { 
            parseError: true, 
            textContent: text.substring(0, 500) + (text.length > 500 ? '...' : '') 
          };
        }
      } else {
        // For non-JSON responses, get the text and truncate if needed
        const text = await response.text();
        responseData = { 
          isHtml: true, 
          textContent: text.substring(0, 500) + (text.length > 500 ? '...' : '') 
        };
      }
      
      setTestResults(prev => 
        prev.map(item => 
          item.route === endpoint 
          ? { 
              ...item, 
              status: response.ok ? 'success' : 'error',
              message: `PHP endpoint ${endpoint} response: ${response.status} ${response.statusText}`,
              result: {
                status: response.status,
                statusText: response.statusText,
                contentType: response.headers.get('content-type'),
                data: responseData
              }
            } 
          : item
        )
      );
    } catch (error: any) {
      setTestResults(prev => 
        prev.map(item => 
          item.route === endpoint 
          ? { 
              ...item, 
              status: 'error',
              message: `PHP endpoint test failed: ${error.message}`,
              error: error
            } 
          : item
        )
      );
    }
  };
  
  // Test all common auth routes
  const testAllAuthRoutes = () => {
    clearTests();
    testRoute('/api/auth/status');
    testRoute('/api/auth/bnet');
    testRoute('/api/auth/bnet/callback');
    testRoute('/api/auth/bnet-direct');
    testRoute('/api/auth/logout');
    testRoute('/api/auth/user');
  };
  
  // Test all PHP endpoints directly
  const testAllPhpEndpoints = () => {
    clearTests();
    // Test endpoints that don't cause redirects
    testPhpEndpoint('/auth-status.php');
    testPhpEndpoint('/auth-user.php');
    // We can add other tests but need to be careful with redirect endpoints
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="bg-wow-dark border-wow-green/30">
        <CardHeader className="border-b border-wow-green/30">
          <CardTitle className="text-2xl text-wow-green">
            Guttakrutt.org API Routes Test
          </CardTitle>
          <CardDescription className="text-wow-light/70">
            Test how API routes would be transformed for the guttakrutt.org domain
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          <div className="flex items-center space-x-2 mb-6">
            <input
              type="checkbox"
              id="mock-production"
              checked={mockProduction}
              onChange={() => setMockProduction(!mockProduction)}
              className="rounded border-wow-green/30 text-wow-green"
            />
            <label htmlFor="mock-production" className="text-wow-light">
              Simulate guttakrutt.org domain environment
            </label>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="outline"
              className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
              onClick={testAllAuthRoutes}
            >
              Test All Auth Routes
            </Button>
            
            {/* Direct Battle.net Redirect Test Button */}
            <Button 
              variant="outline"
              className="border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10"
              onClick={() => {
                const route = mockProduction ? '/auth-bnet.php' : '/api/auth/bnet';
                console.log(`Redirecting to Battle.net auth via: ${route}`);
                window.location.href = route;
              }}
            >
              Test Battle.net Redirect
            </Button>
            
            {mockProduction && (
              <Button 
                variant="outline"
                className="border-purple-500/30 text-purple-500 hover:bg-purple-500/10"
                onClick={testAllPhpEndpoints}
              >
                Test PHP Endpoints Directly
              </Button>
            )}
            
            <Button 
              variant="outline"
              className="border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              onClick={clearTests}
            >
              Clear Results
            </Button>
            
            <Button 
              variant="outline"
              className="border-wow-blue/30 text-wow-blue hover:bg-wow-blue/10"
              onClick={() => window.location.href = '/login-status'}
            >
              Go to Login Status Page
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-xl text-wow-green font-semibold">Test Results</h3>
              
              <div className="space-y-3">
                {testResults.map((test, index) => (
                  <div 
                    key={index} 
                    className={`p-4 rounded-md ${
                      test.status === 'running' ? 'bg-amber-500/10 border border-amber-500/30' :
                      test.status === 'success' ? 'bg-green-500/10 border border-green-500/30' :
                      'bg-red-500/10 border border-red-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className={`font-medium ${
                        test.status === 'running' ? 'text-amber-500' :
                        test.status === 'success' ? 'text-green-500' :
                        'text-red-500'
                      }`}>
                        {test.route}
                      </h4>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        test.status === 'running' ? 'bg-amber-500/20 text-amber-500' :
                        test.status === 'success' ? 'bg-green-500/20 text-green-500' :
                        'bg-red-500/20 text-red-500'
                      }`}>
                        {test.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-wow-light mb-2">{test.message}</p>
                    
                    {test.result && (
                      <div className="mt-2">
                        <Code className="bg-wow-dark text-wow-light block p-3 rounded border border-wow-green/20">
                          {JSON.stringify(test.result, null, 2)}
                        </Code>
                      </div>
                    )}
                    
                    {test.error && (
                      <div className="mt-2">
                        <Code className="bg-red-500/5 text-red-400 block p-3 rounded border border-red-500/20">
                          {JSON.stringify(test.error, null, 2)}
                        </Code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t border-wow-green/30 pt-4">
          <div className="text-wow-light/70 text-sm">
            This page allows testing API route transformations for the guttakrutt.org MySQL domain without deploying to production.
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}