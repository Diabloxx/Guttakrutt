import React, { useState } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader } from 'lucide-react';

function BattleNetDiagnostic() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDiagnosticData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get('/api/diagnostics/bnet-api');
      setResults(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Unknown error');
      toast({
        title: 'Error Fetching Diagnostic Data',
        description: err.response?.data?.message || err.message || 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Safe JSON rendering with null/undefined checks
  const renderJsonData = (data: any) => {
    if (data === null || data === undefined) {
      return (
        <div className="text-xs bg-wow-darker p-3 rounded-md border border-wow-gold/10 text-wow-light/50">
          No data available
        </div>
      );
    }
    
    try {
      return (
        <pre className="text-xs bg-wow-darker p-3 rounded-md overflow-auto max-h-60 border border-wow-gold/10 text-wow-light">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
    } catch (error) {
      return (
        <div className="text-xs bg-wow-darker p-3 rounded-md border border-red-700/20 text-red-300">
          Error rendering data: {String(error)}
        </div>
      );
    }
  };

  return (
    <div className="p-4 bg-wow-darker/50 border border-wow-gold/10 rounded-md w-full">
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-wow-gold">Battle.net API Diagnostic</h4>
          <p className="text-xs text-wow-light/70">Analyze authentication and user data issues</p>
        </div>

        {!results && !loading && (
          <div className="p-4 text-center text-wow-light/70">
            No diagnostic data available. Click "Run Diagnostic" to fetch API responses.
            <p className="text-xs mt-2">You must be logged in with Battle.net for this to work.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center p-4">
            <Loader className="h-6 w-6 animate-spin text-wow-gold" />
            <span className="ml-3 text-wow-light">Running diagnostic...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-4 rounded-md bg-red-900/20 border border-red-900/40 text-red-300">
            <h3 className="font-semibold mb-2 text-red-400">Error Occurred</h3>
            <p className="text-xs">{error}</p>
          </div>
        )}

        {results && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-2 bg-wow-darker border border-wow-gold/20 p-1">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="user-info" className="text-xs">User Info</TabsTrigger>
              <TabsTrigger value="character-info" className="text-xs">Character Info</TabsTrigger>
              <TabsTrigger value="raw-data" className="text-xs">Raw Data</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="space-y-2">
                <div className="p-3 rounded-md bg-wow-darker border border-wow-gold/10">
                  <h3 className="font-semibold mb-2 text-wow-light text-sm">User Information</h3>
                  <ul className="space-y-1 text-xs text-wow-light/80">
                    <li><strong>User ID:</strong> {results?.currentUser?.id}</li>
                    <li><strong>Battle.net ID:</strong> {results?.currentUser?.battleNetId || 'Not available'}</li>
                    <li><strong>BattleTag:</strong> {results?.currentUser?.battleTag || 'Not available'}</li>
                  </ul>
                </div>

                <div className="p-3 rounded-md bg-wow-darker border border-wow-gold/10">
                  <h3 className="font-semibold mb-2 text-wow-light text-sm">Response Status</h3>
                  <ul className="space-y-1 text-xs text-wow-light/80">
                    <li><strong>User Info:</strong> {results?.responses?.userInfo ? `${results.responses.userInfo.status} OK` : 'No data'}</li>
                    <li><strong>Characters:</strong> {results?.responses?.charactersInfo ? `${results.responses.charactersInfo.status} OK` : 'No data'}</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="user-info">
              <div className="p-3 rounded-md bg-wow-darker border border-wow-gold/10">
                <h3 className="font-semibold mb-2 text-wow-light text-sm">User Info Response</h3>
                <p className="text-xs mb-2 text-wow-light/70">Status: {results?.responses?.userInfo?.status}</p>
                <Separator className="my-2 bg-wow-gold/10" />
                {renderJsonData(results?.responses?.userInfo?.data)}
              </div>
            </TabsContent>

            <TabsContent value="character-info">
              <div className="p-3 rounded-md bg-wow-darker border border-wow-gold/10">
                <h3 className="font-semibold mb-2 text-wow-light text-sm">Character Info Response</h3>
                <p className="text-xs mb-2 text-wow-light/70">Status: {results?.responses?.charactersInfo?.status}</p>
                <Separator className="my-2 bg-wow-gold/10" />
                {renderJsonData(results?.responses?.charactersInfo?.data)}
              </div>
            </TabsContent>

            <TabsContent value="raw-data">
              <div className="p-3 rounded-md bg-wow-darker border border-wow-gold/10">
                <h3 className="font-semibold mb-2 text-wow-light text-sm">Raw Response Data</h3>
                {renderJsonData(results)}
              </div>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-between mt-4">
          <Button 
            variant="outline" 
            onClick={() => setResults(null)} 
            disabled={loading || !results}
            className="border-wow-gold/20 text-wow-gold hover:bg-wow-gold/10 text-xs py-1 h-8"
          >
            Clear Results
          </Button>
          <Button 
            onClick={fetchDiagnosticData} 
            disabled={loading}
            className="bg-wow-gold text-wow-dark hover:bg-wow-gold/90 text-xs py-1 h-8"
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-3 w-3 animate-spin" />
                Running...
              </>
            ) : 'Run Diagnostic'}
          </Button>
        </div>
    </div>
  );
}

export default BattleNetDiagnostic;