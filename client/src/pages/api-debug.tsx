import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isGuttakruttOrg } from '../lib/api-routes';

export default function ApiDebugPage() {
  const [authUserResponse, setAuthUserResponse] = useState<any>(null);
  const [myCharactersResponse, setMyCharactersResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGuttakrutt, setIsGuttakrutt] = useState(false);

  // Check domain on mount
  useEffect(() => {
    setIsGuttakrutt(isGuttakruttOrg());
  }, []);

  // Function to test /auth-user.php endpoint
  const testAuthUserEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/auth-user.php?t=' + Date.now(), {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('Auth user response status:', response.status);
      
      // Clone the response for debugging
      const clonedResponse = response.clone();
      const rawText = await clonedResponse.text();
      console.log('Raw response:', rawText.substring(0, 200) + '...');
      
      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(rawText);
        setAuthUserResponse(jsonData);
      } catch (jsonError) {
        setAuthUserResponse({
          error: 'Failed to parse JSON',
          rawText: rawText.substring(0, 500) + '...'
        });
      }
    } catch (err) {
      console.error('Error fetching auth user:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  // Function to test /auth-characters.php endpoint
  const testMyCharactersEndpoint = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/auth-characters.php?t=' + Date.now(), {
        credentials: 'include',
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('My characters response status:', response.status);
      
      // Clone the response for debugging
      const clonedResponse = response.clone();
      const rawText = await clonedResponse.text();
      console.log('Raw response:', rawText.substring(0, 200) + '...');
      
      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(rawText);
        setMyCharactersResponse(jsonData);
      } catch (jsonError) {
        setMyCharactersResponse({
          error: 'Failed to parse JSON',
          rawText: rawText.substring(0, 500) + '...'
        });
      }
    } catch (err) {
      console.error('Error fetching my characters:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-10 px-4 mx-auto">
      <h1 className="text-3xl font-bold text-wow-green mb-6">API Debug Page</h1>
      
      <Card className="mb-6 bg-wow-dark border-wow-green/30">
        <CardHeader>
          <CardTitle className="text-wow-green">Environment Information</CardTitle>
          <CardDescription className="text-wow-light/70">
            Details about the current environment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-wow-light"><strong>Window Location:</strong> {window.location.href}</p>
              <p className="text-wow-light"><strong>Hostname:</strong> {window.location.hostname}</p>
              <p className="text-wow-light"><strong>Protocol:</strong> {window.location.protocol}</p>
              <p className="text-wow-light"><strong>isGuttakruttOrg():</strong> {isGuttakrutt ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="auth-user" className="w-full mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="auth-user">Auth User Endpoint</TabsTrigger>
          <TabsTrigger value="my-characters">My Characters Endpoint</TabsTrigger>
        </TabsList>
        
        <TabsContent value="auth-user">
          <Card className="bg-wow-dark border-wow-green/30">
            <CardHeader>
              <CardTitle className="text-wow-green">Test /auth-user.php Endpoint</CardTitle>
              <CardDescription className="text-wow-light/70">
                Direct test of the /auth-user.php endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testAuthUserEndpoint} 
                disabled={loading}
                className="mb-4 bg-wow-green text-black hover:bg-wow-green/90"
              >
                {loading ? 'Testing...' : 'Test Endpoint Now'}
              </Button>
              
              {error && (
                <div className="p-4 border border-red-500 rounded-md bg-red-500/10 mb-4">
                  <p className="text-red-500">Error: {error}</p>
                </div>
              )}
              
              {authUserResponse && (
                <div className="p-4 border border-wow-green/30 rounded-md bg-wow-dark">
                  <h3 className="text-wow-green mb-2">Response:</h3>
                  <pre className="text-wow-light bg-black/30 p-4 rounded-md overflow-auto max-h-60 text-sm">
                    {JSON.stringify(authUserResponse, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="my-characters">
          <Card className="bg-wow-dark border-wow-green/30">
            <CardHeader>
              <CardTitle className="text-wow-green">Test /auth-characters.php Endpoint</CardTitle>
              <CardDescription className="text-wow-light/70">
                Direct test of the /auth-characters.php endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={testMyCharactersEndpoint} 
                disabled={loading}
                className="mb-4 bg-wow-green text-black hover:bg-wow-green/90"
              >
                {loading ? 'Testing...' : 'Test Endpoint Now'}
              </Button>
              
              {error && (
                <div className="p-4 border border-red-500 rounded-md bg-red-500/10 mb-4">
                  <p className="text-red-500">Error: {error}</p>
                </div>
              )}
              
              {myCharactersResponse && (
                <div className="p-4 border border-wow-green/30 rounded-md bg-wow-dark">
                  <h3 className="text-wow-green mb-2">Response:</h3>
                  <pre className="text-wow-light bg-black/30 p-4 rounded-md overflow-auto max-h-60 text-sm">
                    {JSON.stringify(myCharactersResponse, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="bg-wow-dark border-wow-green/30">
        <CardHeader>
          <CardTitle className="text-wow-green">Troubleshooting Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-wow-light">
            <li>If you're seeing <code className="bg-black/30 px-1 rounded">Unexpected token '&lt;', "&lt;!DOCTYPE "... is not valid JSON</code> errors,
              it means an HTML page is being returned instead of JSON.</li>
            <li>This typically happens when there's a server error (500) and PHP is returning an error page.</li>
            <li>Check if proper headers are being set on the PHP endpoints (<code className="bg-black/30 px-1 rounded">Content-Type: application/json</code>).</li>
            <li>Use this debug page to test the endpoints directly for more details.</li>
          </ol>
        </CardContent>
        <CardFooter>
          <p className="text-wow-light/70 text-sm">
            Debug information can help identify issues with the PHP simulation endpoints.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}