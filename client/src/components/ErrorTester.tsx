import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle, Bug, ServerCrash, Zap, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

/**
 * Component for testing different types of errors in the application
 * This is intended for development and testing use only
 */
export function ErrorTester() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  
  // Test server-side error handling
  const testServerError = async () => {
    try {
      await apiRequest('GET', '/api/test-error');
      // This should never execute due to the error
      setServerError('The server should have returned an error but did not.');
    } catch (error: any) {
      // This will execute if the error is properly caught and returned
      setServerError(`Server error handling works! The server returned: ${error.message || 'Unknown error'}`);
    }
  };

  // Test client-side error boundary
  const triggerErrorBoundary = () => {
    // This will cause a TypeError that should be caught by the ErrorBoundary
    const obj: any = null;
    obj.nonExistentMethod();
  };

  // Test unhandled promise rejection
  const triggerUnhandledRejection = () => {
    // Create a promise that rejects without a catch handler
    new Promise((_, reject) => {
      reject(new Error('Test unhandled promise rejection'));
    });
    setClientError('Triggered unhandled promise rejection. Check the console for logs.');
  };

  // Test window.onerror
  const triggerWindowError = () => {
    // Deliberately cause a reference error
    try {
      // @ts-ignore - This will throw a ReferenceError at runtime
      nonExistentVariable.someMethod();
    } catch (e: any) {
      setClientError(`Triggered window error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-amber-900/30 to-amber-800/10">
            <CardTitle className="text-wow-gold text-lg flex items-center">
              <ServerCrash className="h-5 w-5 mr-2 text-amber-400" />
              Server Error Testing
            </CardTitle>
            <CardDescription className="text-wow-light/70">
              Test the server-side error handling capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-sm text-wow-light">
              This will send a request to a test endpoint that intentionally throws an error.
              The error will be caught by the server's error handling middleware and returned
              as a JSON response.
            </p>
            
            <Button 
              variant="destructive" 
              onClick={testServerError}
              className="w-full bg-amber-950/60 hover:bg-amber-900/80 text-wow-light border border-amber-800/30"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Test Server Error
            </Button>
            
            {serverError && (
              <Alert className="bg-amber-950/20 border-amber-900/40 text-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertTitle>Server Error Response</AlertTitle>
                <AlertDescription className="text-sm break-all text-wow-light/90">
                  {serverError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
        
        <Card className="bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden">
          <CardHeader className="pb-2 bg-gradient-to-r from-red-900/30 to-red-800/10">
            <CardTitle className="text-wow-gold text-lg flex items-center">
              <Bug className="h-5 w-5 mr-2 text-red-400" />
              Client Error Testing
            </CardTitle>
            <CardDescription className="text-wow-light/70">
              Test the client-side error handling capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-wow-light">
                These tests will trigger different types of client-side errors:
              </p>
              <ul className="text-xs text-wow-light/70 list-disc pl-5 space-y-1">
                <li>Error Boundary - Triggers a React error boundary</li>
                <li>Window Error - Tests window.onerror handling</li>
                <li>Promise Rejection - Tests unhandled promise rejections</li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="destructive" 
                onClick={triggerErrorBoundary}
                className="bg-red-950/60 hover:bg-red-900/80 text-wow-light border border-red-800/30"
              >
                <Zap className="h-4 w-4 mr-2" />
                Error Boundary
              </Button>
              <Button 
                variant="destructive" 
                onClick={triggerWindowError}
                className="bg-red-950/60 hover:bg-red-900/80 text-wow-light border border-red-800/30"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Window Error
              </Button>
              <Button 
                variant="destructive" 
                onClick={triggerUnhandledRejection}
                className="col-span-2 bg-red-950/60 hover:bg-red-900/80 text-wow-light border border-red-800/30"
              >
                <Bug className="h-4 w-4 mr-2" />
                Unhandled Rejection
              </Button>
            </div>
            
            {clientError && (
              <Alert className="bg-red-950/20 border-red-900/40 text-red-200">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertTitle>Client Error Detected</AlertTitle>
                <AlertDescription className="text-sm break-all text-wow-light/90">
                  {clientError}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
      
      {(serverError || clientError) && (
        <div className="flex justify-end">
          <Button 
            variant="outline" 
            onClick={() => {
              setServerError(null);
              setClientError(null);
            }}
            className="bg-black/30 border-wow-gold/30 text-wow-gold hover:bg-black/50 hover:text-wow-gold"
          >
            <X className="h-4 w-4 mr-2" />
            Clear All Error Messages
          </Button>
        </div>
      )}
      
      <div className="bg-black/40 rounded-lg p-4 border border-wow-gold/10">
        <h3 className="text-wow-gold text-lg mb-2">How to Verify Error Handling</h3>
        <p className="text-wow-light text-sm mb-4">
          After triggering any error above, you should check the following to ensure errors are properly handled:
        </p>
        
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-amber-400 font-medium">1. Check System Logs</h4>
            <p className="text-wow-light/70 text-sm">
              Go to the System Logs section in the admin panel to see detailed error logs.
            </p>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-amber-400 font-medium">2. Verify Application Stability</h4>
            <p className="text-wow-light/70 text-sm">
              The application should continue to function despite the errors, thanks to the error boundaries.
            </p>
          </div>
          
          <div className="space-y-1">
            <h4 className="text-amber-400 font-medium">3. Check Browser Console</h4>
            <p className="text-wow-light/70 text-sm">
              Open your browser's developer tools to see additional error details in the console.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ErrorTester;