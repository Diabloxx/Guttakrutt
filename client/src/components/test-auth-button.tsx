import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Development utility for testing authentication flows
 * This component is for development purposes only and will not display in production
 */
export function TestAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  
  // Only show in development mode, not in production
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  // Safe navigation to the API auth endpoint
  const handleApiAuthTest = () => {
    setIsLoading(true);
    console.log('Navigating to API auth endpoint');
    
    // Create relative URL path with no interpolation
    const path = '/api/auth/login';
    // Safe navigation with browser's own URL resolution
    window.location.assign(path);
  };
  
  // Safe navigation to the PHP simulation endpoint
  const handlePhpAuthTest = () => {
    setIsLoading(true);
    console.log('Navigating to PHP auth endpoint');
    
    // Create relative URL path with no interpolation
    const path = '/auth-bnet-direct.php';
    // Safe navigation with browser's own URL resolution
    window.location.assign(path);
  };
  
  return (
    <div className="fixed bottom-4 left-4 flex flex-col space-y-2 z-50">
      <Button 
        onClick={handleApiAuthTest} 
        disabled={isLoading}
        variant="wow"
        className="flex items-center"
        aria-label="Test API Authentication"
      >
        {isLoading ? 'Loading...' : 'API Auth Test'}
      </Button>
      
      <Button 
        onClick={handlePhpAuthTest} 
        disabled={isLoading} 
        variant="wow-dark"
        className="flex items-center"
        aria-label="Test PHP Authentication"
      >
        {isLoading ? 'Loading...' : 'PHP Auth Test'}
      </Button>
    </div>
  );
}