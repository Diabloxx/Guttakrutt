import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Shield, RefreshCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

/**
 * Battle.net Characters diagnostic component
 * Shows characters from the Battle.net API directly
 */
function BattleNetCharacters() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Fetch the character data from the API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['/api/diagnostics/bnet-api'],
    refetchOnWindowFocus: false,
  });
  
  const handleRunDiagnostic = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: t('diagnostic.refreshed', 'Diagnostic Data Refreshed'),
        description: t('diagnostic.refreshed_desc', 'Character data has been refreshed from the Battle.net API'),
      });
    } catch (refreshError) {
      toast({
        title: t('diagnostic.refresh_error', 'Refresh Error'),
        description: refreshError instanceof Error ? refreshError.message : String(refreshError),
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Extract characters from the API response - properly typed
  const apiData = data as any; // Cast to any to handle the unknown structure
  
  // Get characters with multiple fallbacks - ensure we always get an array
  const characters: any[] = [];
  
  try {
    // First, try to use the pre-processed characterSummary (most reliable)
    if (apiData?.characterSummary && Array.isArray(apiData.characterSummary)) {
      apiData.characterSummary.forEach((char: any) => {
        if (char && typeof char === 'object') {
          characters.push(char);
        }
      });
    } 
    // Otherwise, try to extract from raw API response
    else if (apiData?.responses?.charactersInfo?.data?.wow_accounts) {
      const accounts = apiData.responses.charactersInfo.data.wow_accounts;
      if (Array.isArray(accounts)) {
        // Combine all characters from all accounts
        accounts.forEach(account => {
          if (account && account.characters && Array.isArray(account.characters)) {
            account.characters.forEach(character => {
              if (character && character.name) {
                characters.push(character);
              }
            });
          }
        });
      }
    }
  } catch (parseError) {
    console.error('Error parsing character data:', parseError);
  }
  
  // Get the Battle.net username or battletag
  const battleTag = apiData?.currentUser?.battleTag || 
                   apiData?.responses?.userInfo?.data?.battletag || 
                   'Unknown#0000';

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-lg p-4 w-full">
      <div className="flex items-center justify-between w-full mb-3">
        <h3 className="text-md font-semibold text-slate-100 flex items-center truncate">
          <Users className="h-4 w-4 mr-2 text-blue-400 flex-shrink-0" />
          <span className="truncate">{t('diagnostic.characters_title', 'Battle.net Character Data')}</span>
        </h3>
        
        <Button
          size="sm"
          variant="outline"
          className="h-8 bg-slate-800 hover:bg-slate-700 border-slate-600 flex-shrink-0 ml-2"
          onClick={handleRunDiagnostic}
          disabled={isLoading || isRefreshing}
        >
          {isLoading || isRefreshing ? (
            <div className="flex items-center">
              <Loader2 className="h-3 w-3 animate-spin mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('diagnostic.loading', 'Loading...')}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <RefreshCcw className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="whitespace-nowrap">{t('diagnostic.refresh', 'Refresh')}</span>
            </div>
          )}
        </Button>
      </div>
      
      <div className="flex items-center mb-3 text-xs w-full">
        <span className="text-slate-400 flex-shrink-0 mr-2">{t('diagnostic.battle_tag', 'Battle.net Account')}:</span>
        <span className="bg-blue-950 text-blue-200 px-2 py-1 rounded font-semibold truncate">
          {battleTag}
        </span>
      </div>

      <div className="w-full">
        {isLoading ? (
          <div className="flex justify-center items-center p-4 w-full">
            <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-800/30 rounded p-3 text-sm text-red-300 w-full">
            {error instanceof Error ? error.message : String(error)}
          </div>
        ) : characters.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700/50 rounded p-3 text-sm text-slate-400 text-center w-full">
            {t('diagnostic.no_characters', 'No characters found in Battle.net account')}
          </div>
        ) : (
          <div className="space-y-2 w-full">
            {characters.map((character, idx) => {
              // Try to render the character with detailed info
              try {
                // Extract character information with multiple fallbacks
                const name = character.name || '?';
                const level = character.level || '?';
                const className = character.class || character.character_class?.name?.en_US || '?';
                const raceName = character.race || character.playable_race?.name?.en_US || '';
                const realmName = character.realm?.name || character.realm || '?';
                const faction = character.faction?.type || character.faction || '';
                const isAlliance = faction === 'ALLIANCE';
                const isHorde = faction === 'HORDE';
                
                // Determine the CSS color class based on character class
                const classColorClass = className && typeof className === 'string' ? 
                  `text-wow-${className.toLowerCase().replace(' ', '-')}` : 
                  'text-slate-200';
                
                return (
                  <div 
                    key={`char-${idx}`}
                    className="bg-slate-800/70 border border-slate-700/40 rounded p-2 flex items-center w-full"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                      {isAlliance && (
                        <Shield className="h-5 w-5 text-blue-400" />
                      )}
                      {isHorde && (
                        <Shield className="h-5 w-5 text-red-500" />
                      )}
                      {!isAlliance && !isHorde && (
                        <span className="text-lg font-bold text-slate-400">{name.charAt(0)}</span>
                      )}
                    </div>
                    
                    <div className="ml-3 min-w-0 flex-1">
                      <p className={cn("font-medium truncate", classColorClass)}>
                        {name}
                      </p>
                      <p className="text-xs text-slate-400 truncate">
                        {t('diagnostic.level', 'Level {{level}} {{race}} {{class}}', {
                          level,
                          race: raceName,
                          class: className
                        })}
                      </p>
                    </div>
                    
                    <div className="ml-2 flex-shrink-0">
                      <span className={cn("px-1.5 py-0.5 rounded text-xs whitespace-nowrap",
                        isAlliance ? "bg-blue-950/80 text-blue-200 border border-blue-800/30" :
                        isHorde ? "bg-red-950/80 text-red-200 border border-red-800/30" :
                        "bg-slate-700/50 text-slate-300 border border-slate-600/30"
                      )}>
                        {realmName}
                      </span>
                    </div>
                  </div>
                );
              } catch (error) {
                console.error('Error rendering character:', error);
                // Fallback rendering if the detailed rendering fails
                return (
                  <div 
                    key={`fallback-${idx}`}
                    className="bg-slate-800/70 border border-red-700/30 rounded flex items-center p-2 w-full"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center overflow-hidden">
                      <span className="text-lg font-bold text-slate-200">?</span>
                    </div>
                    <div className="ml-3 min-w-0 flex-1">
                      <p className="font-medium text-slate-200 truncate">
                        {character.name || 'Unknown Character'}
                      </p>
                      <p className="text-xs text-red-400 truncate">Error rendering character data</p>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BattleNetCharacters;