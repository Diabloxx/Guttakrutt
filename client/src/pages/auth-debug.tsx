import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, Shield, Check, X, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';

export default function AuthDebugPage() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('status');
  
  // Function to check auth status using various methods
  const checkAuthStatus = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Check if we're on guttakrutt.org or local
      const isGuttakruttOrg = window.location.hostname.includes('guttakrutt.org');
      
      // First try the PHP endpoint if on guttakrutt.org
      const statusUrl = isGuttakruttOrg ? '/auth-status.php' : '/api/auth/status';
      
      console.log(`Checking auth status using ${statusUrl}`);
      const response = await fetch(statusUrl, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Also check the debug endpoint
      const debugResponse = await fetch('/api/auth-debug', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Check Windows auth status
      const windowsResponse = await fetch('/windows-auth/status', {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });
      
      // Combine all status information
      const statusData = await response.json();
      const debugData = await debugResponse.json();
      const windowsData = await windowsResponse.json();
      
      setAuthStatus({
        standardAuth: statusData,
        debugInfo: debugData,
        windowsAuth: windowsData,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error checking auth status:', err);
      setError(err.message || 'Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };
  
  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
    // Set up periodic refresh
    const interval = setInterval(checkAuthStatus, 10000);
    return () => clearInterval(interval);
  }, []);
  
  if (loading && !authStatus) {
    return (
      <div className="container py-10 px-4 mx-auto flex items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-wow-green/30 border-t-wow-green rounded-full animate-spin"></div>
      </div>
    );
  }
  
  const authenticated = authStatus?.standardAuth?.authenticated || 
                        authStatus?.windowsAuth?.authenticated || 
                        authStatus?.debugInfo?.isAuthenticated;
  
  return (
    <div className="container py-10 px-4 mx-auto">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-cinzel text-wow-green mb-2">Authentication Debug</h1>
            <p className="text-wow-light/70">
              A tool to help diagnose authentication issues
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={checkAuthStatus}
              className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            <Button 
              variant={authenticated ? "destructive" : "default"}
              onClick={() => {
                if (authenticated) {
                  // Logout via API
                  apiRequest('POST', '/api/auth/logout')
                    .then(() => {
                      window.location.reload();
                    })
                    .catch(err => {
                      console.error('Logout failed:', err);
                      setError('Logout failed: ' + err.message);
                    });
                } else {
                  // Login via PHP endpoint on guttakrutt.org, otherwise use API
                  const isGuttakruttOrg = window.location.hostname.includes('guttakrutt.org');
                  window.location.href = isGuttakruttOrg ? '/auth-bnet.php' : '/api/auth/bnet';
                }
              }}
            >
              {authenticated ? (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Login with Battle.net
                </>
              )}
            </Button>
          </div>
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="bg-wow-dark border border-wow-green/30 rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start">
            <div>
              <h2 className="text-xl font-medium text-wow-green mb-2">Authentication Status</h2>
              <p className="text-wow-light/70 text-sm">
                Last updated: {authStatus?.timestamp ? new Date(authStatus.timestamp).toLocaleString() : 'Unknown'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={authenticated ? 'bg-green-500' : 'bg-red-500'}>
                {authenticated ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Authenticated
                  </>
                ) : (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Not Authenticated
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="status" className="text-wow-light hover:text-wow-green">
              <Info className="h-4 w-4 mr-2" />
              Status
            </TabsTrigger>
            <TabsTrigger value="windows" className="text-wow-light hover:text-wow-green">
              <Shield className="h-4 w-4 mr-2" />
              Windows Auth
            </TabsTrigger>
            <TabsTrigger value="debug" className="text-wow-light hover:text-wow-green">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Debug Info
            </TabsTrigger>
            <TabsTrigger value="actions" className="text-wow-light hover:text-wow-green">
              <LogOut className="h-4 w-4 mr-2" />
              Auth Actions
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="status">
            <Card className="bg-wow-dark border-wow-green/30">
              <CardHeader>
                <CardTitle className="text-2xl text-wow-green">Standard Auth Status</CardTitle>
                <CardDescription className="text-wow-light/70">
                  Information from the standard auth endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-zinc-900 p-4 rounded-md text-wow-light overflow-auto">
                  {JSON.stringify(authStatus?.standardAuth || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="windows">
            <Card className="bg-wow-dark border-wow-green/30">
              <CardHeader>
                <CardTitle className="text-2xl text-wow-green">Windows Auth Status</CardTitle>
                <CardDescription className="text-wow-light/70">
                  Information from the Windows-specific auth endpoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-zinc-900 p-4 rounded-md text-wow-light overflow-auto">
                  {JSON.stringify(authStatus?.windowsAuth || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="debug">
            <Card className="bg-wow-dark border-wow-green/30">
              <CardHeader>
                <CardTitle className="text-2xl text-wow-green">Debug Information</CardTitle>
                <CardDescription className="text-wow-light/70">
                  Detailed debug information from the server
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-zinc-900 p-4 rounded-md text-wow-light overflow-auto">
                  {JSON.stringify(authStatus?.debugInfo || {}, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="actions">
            <Card className="bg-wow-dark border-wow-green/30">
              <CardHeader>
                <CardTitle className="text-2xl text-wow-green">Authentication Actions</CardTitle>
                <CardDescription className="text-wow-light/70">
                  Test different authentication methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-wow-light font-semibold mb-2">Standard Authentication</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/api/auth/bnet';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      Standard Battle.net Login
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        apiRequest('POST', '/api/auth/logout')
                          .then(() => {
                            window.location.reload();
                          })
                          .catch(err => {
                            console.error('Logout failed:', err);
                            setError('Logout failed: ' + err.message);
                          });
                      }}
                    >
                      Standard Logout
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-wow-green/30" />
                
                <div>
                  <h3 className="text-wow-light font-semibold mb-2">PHP Simulation (for guttakrutt.org)</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/auth-bnet.php';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      PHP Login
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/auth-logout.php';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      PHP Logout
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/auth-status.php';
                        console.log(`Navigating to ${url}`);
                        window.open(url, '_blank');
                      }}
                    >
                      Check PHP Status
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-wow-green/30" />
                
                <div>
                  <h3 className="text-wow-light font-semibold mb-2">Windows Authentication</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/windows-auth/login';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      Windows Login
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/windows-auth/logout';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      Windows Logout
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/windows-auth/status';
                        console.log(`Checking ${url}`);
                        window.open(url, '_blank');
                      }}
                    >
                      Check Windows Status
                    </Button>
                  </div>
                </div>
                
                <Separator className="bg-wow-green/30" />
                
                <div>
                  <h3 className="text-wow-light font-semibold mb-2">Direct Auth Router</h3>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/api/direct/login';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      Direct Login
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/api/direct/logout';
                        console.log(`Navigating to ${url}`);
                        window.location.href = url;
                      }}
                    >
                      Direct Logout
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="border-wow-green/30 text-wow-green hover:bg-wow-green/10"
                      onClick={() => {
                        const url = '/api/direct/status';
                        console.log(`Checking ${url}`);
                        window.open(url, '_blank');
                      }}
                    >
                      Check Direct Status
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8">
          <h2 className="text-xl font-medium text-wow-green mb-4">Help with Battle.net Authentication</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-wow-dark border-wow-green/30">
              <CardHeader>
                <CardTitle className="text-xl text-wow-green">Common Issues</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-wow-light/80">
                  <span className="font-semibold">Session Issues:</span> If your session is not being maintained, try clearing cookies or using a different browser.
                </p>
                <p className="text-wow-light/80">
                  <span className="font-semibold">Callback Errors:</span> If you see errors about invalid redirects, ensure the Battle.net client is configured with the correct callback URL.
                </p>
                <p className="text-wow-light/80">
                  <span className="font-semibold">Database Errors:</span> If user creation fails, this may indicate a database connection issue.
                </p>
                <p className="text-wow-light/80">
                  <span className="font-semibold">Windows Environment:</span> On Windows servers, try using the Windows-specific authentication endpoints.
                </p>
              </CardContent>
            </Card>
            
            <Card className="bg-wow-dark border-wow-green/30">
              <CardHeader>
                <CardTitle className="text-xl text-wow-green">Troubleshooting Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-wow-light/80">1. Clear browser cookies and cache</p>
                <p className="text-wow-light/80">2. Try using a different authentication endpoint</p>
                <p className="text-wow-light/80">3. Check if you're already authenticated in a different tab</p>
                <p className="text-wow-light/80">4. Ensure the Battle.net API credentials are valid</p>
                <p className="text-wow-light/80">5. On Windows, try appending <code>?auth=windows</code> to the profile URL</p>
                <p className="text-wow-light/80">6. Check the session store configuration in the server</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}