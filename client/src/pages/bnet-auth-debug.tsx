import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from '@/lib/queryClient';

// A debug page to help troubleshoot Battle.net OAuth issues
export default function BattleNetAuthDebug() {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to get current auth status
  const fetchAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRequest('GET', '/api/auth/status');
      const data = await response.json();
      
      setAuthInfo(data);
    } catch (err) {
      setError('Failed to fetch auth status: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuthStatus();
  }, []);

  // This should match EXACTLY what's in your Blizzard Developer Portal
  const registeredCallbackUrl = "https://guttakrutt.org/api/auth/bnet/callback";
  
  // These are the OAuth endpoints we're using
  const oauthEndpoint = "https://oauth.battle.net/authorize";
  const tokenEndpoint = "https://oauth.battle.net/token";

  // For testing, manually construct the auth URL
  // Note: Using import.meta.env for Vite frontend env vars instead of process.env (which is Node.js only)
  const clientId = import.meta.env.VITE_BLIZZARD_CLIENT_ID || '(not available in frontend)';
  const redirectUri = encodeURIComponent(registeredCallbackUrl);
  const scope = "wow.profile";
  const state = "direct_debug_state_" + Date.now().toString().slice(-6);
  
  // Construct auth URL for direct testing
  const directAuthUrl = `${oauthEndpoint}?response_type=code&client_id=${clientId}&scope=${scope}&state=${state}&redirect_uri=${redirectUri}`;

  return (
    <div className="container py-10 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Battle.net Authentication Debug</CardTitle>
          <CardDescription>
            Use this page to troubleshoot Battle.net OAuth login issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="font-medium text-lg">1. Check Battle.net Developer Portal Settings</h3>
            <p>Make sure your callback URL is <strong>exactly</strong>:</p>
            <pre className="bg-muted p-2 rounded-md overflow-x-auto">
              {registeredCallbackUrl}
            </pre>
            <p className="text-sm text-muted-foreground">
              This must match character-for-character, including protocol (https://), 
              no trailing slash, and the exact path.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-lg">2. Configuration Information</h3>
            <p>These are the OAuth endpoints we're using:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Authorization URL:</strong> {oauthEndpoint}</li>
              <li><strong>Token URL:</strong> {tokenEndpoint}</li>
              <li><strong>Callback URL:</strong> {registeredCallbackUrl}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-lg">3. Direct Authentication Test</h3>
            <p>Click the button below to attempt authentication directly:</p>
            <Button 
              variant="default" 
              className="w-full"
              onClick={() => window.location.href = directAuthUrl}
            >
              Test Direct Battle.net Auth
            </Button>
            <p className="text-sm text-muted-foreground">
              This uses the exact same parameters, but skips the server-side session handling.
              If this fails with the same error, the issue is with the Blizzard API configuration.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium text-lg">4. Current Authentication Status</h3>
            <Button 
              variant="outline" 
              onClick={fetchAuthStatus} 
              disabled={loading}
              className="mb-2"
            >
              {loading ? 'Loading...' : 'Refresh Status'}
            </Button>
            
            {error && (
              <div className="p-2 bg-destructive/10 text-destructive rounded-md">
                {error}
              </div>
            )}
            
            {authInfo && (
              <div className="bg-muted p-2 rounded-md max-h-80 overflow-y-auto">
                <pre>{JSON.stringify(authInfo, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}