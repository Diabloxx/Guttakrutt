import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Loader2, RefreshCw, Shield, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

/**
 * Component that displays a user's World of Warcraft characters
 * and provides functionality to fetch them from the Battle.net API
 */
export function CharacterList() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, refreshUserCharacters, setMainCharacterMutation } = useAuth();
  
  // Fetch characters directly
  const { data: characterData, isLoading: charactersLoading, isError, error } = useQuery({
    queryKey: ['/api/characters'],
    queryFn: async () => {
      try {
        const response = await axios.get('/api/characters');
        return response.data;
      } catch (err) {
        console.error('Error fetching characters:', err);
        // Return an empty data structure to prevent UI errors
        return { success: true, data: { characters: [] } };
      }
    },
    enabled: !!user,
    // Add retry and stale time for better user experience
    retry: 1,
    staleTime: 1000 * 60, // 1 minute
  });
  
  // Define the character interface
  interface Character {
    id: number;
    name: string;
    class: string;
    className?: string;
    realm: string;
    level: number;
    isMain: boolean;
    verified: boolean;
    avatarUrl?: string;
    faction?: string;
    race?: string;
    [key: string]: any;
  }
  
  // Extract characters and main character
  const characters: Character[] = characterData?.data?.characters || [];
  const mainCharacter: Character | null = characters.find((char: Character) => char.isMain) || null;
  
  // Mutation to fetch characters from Battle.net
  const fetchCharactersMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get('/api/characters/fetch-bnet-characters');
      return response.data;
    },
    onSuccess: (data) => {
      toast({
        title: t('character.fetch_success'),
        description: t('character.fetch_success_description', { count: data.characters?.length || 0 }),
      });
      refreshUserCharacters();
    },
    onError: (error: any) => {
      console.error('Error fetching characters:', error);
      
      // Special handling for token expired errors
      if (error.response?.data?.error === 'token_expired') {
        toast({
          title: t('character.token_expired'),
          description: t('character.reconnect_bnet'),
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: t('character.fetch_error'),
        description: error.response?.data?.message || error.message || t('character.fetch_error_description'),
        variant: 'destructive',
      });
    },
  });
  
  // Function to get character background color based on class
  const getClassColor = (className: string): string => {
    const classColors: Record<string, string> = {
      'Death Knight': 'rgba(196, 30, 59, 0.2)',
      'Demon Hunter': 'rgba(163, 48, 201, 0.2)',
      'Druid': 'rgba(255, 125, 10, 0.2)',
      'Hunter': 'rgba(171, 212, 115, 0.2)',
      'Mage': 'rgba(105, 204, 240, 0.2)',
      'Monk': 'rgba(0, 255, 150, 0.2)',
      'Paladin': 'rgba(245, 140, 186, 0.2)',
      'Priest': 'rgba(255, 255, 255, 0.2)',
      'Rogue': 'rgba(255, 245, 105, 0.2)',
      'Shaman': 'rgba(0, 112, 222, 0.2)',
      'Warlock': 'rgba(148, 130, 201, 0.2)',
      'Warrior': 'rgba(199, 156, 110, 0.2)',
      'Evoker': 'rgba(51, 147, 127, 0.2)',
    };
    return classColors[className] || 'rgba(150, 150, 150, 0.2)';
  };
  
  // Function to get class text color
  const getClassTextColor = (className: string): string => {
    const classColors: Record<string, string> = {
      'Death Knight': 'rgb(196, 30, 59)',
      'Demon Hunter': 'rgb(163, 48, 201)',
      'Druid': 'rgb(255, 125, 10)',
      'Hunter': 'rgb(171, 212, 115)',
      'Mage': 'rgb(105, 204, 240)',
      'Monk': 'rgb(0, 255, 150)',
      'Paladin': 'rgb(245, 140, 186)',
      'Priest': 'rgb(255, 255, 255)',
      'Rogue': 'rgb(255, 245, 105)',
      'Shaman': 'rgb(0, 112, 222)',
      'Warlock': 'rgb(148, 130, 201)',
      'Warrior': 'rgb(199, 156, 110)',
      'Evoker': 'rgb(51, 147, 127)',
    };
    return classColors[className] || 'rgb(150, 150, 150)';
  };
  
  // Function to set a character as main
  const setMainCharacter = (characterId: number) => {
    setMainCharacterMutation.mutate(characterId);
  };
  
  // If there's no authenticated user, show a message
  if (!user) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('character.no_characters')}</CardTitle>
          <CardDescription>{t('character.login_to_view')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  // If there's a Battle.net connection but no characters, or empty characters array
  const hasCharacters = characters && characters.length > 0;
  const hasBattleNetAccount = !!user.battleNetId && !!user.battleTag;
  
  // Render the battle.net fetch button or character list
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {t('character.your_characters')}
          {hasBattleNetAccount && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchCharactersMutation.mutate()} 
              disabled={fetchCharactersMutation.isPending}
            >
              {fetchCharactersMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {t('character.refresh_from_bnet')}
            </Button>
          )}
        </CardTitle>
        <CardDescription>
          {hasBattleNetAccount 
            ? t('character.connected_to_bnet', { tag: user.battleTag }) 
            : t('character.no_bnet_connected')}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {fetchCharactersMutation.isPending || charactersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3">
              {fetchCharactersMutation.isPending 
                ? t('character.fetching') 
                : t('character.loading')}
            </span>
          </div>
        ) : !hasCharacters ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground">{t('character.no_characters_found')}</p>
            {hasBattleNetAccount && (
              <Button 
                variant="default" 
                className="mt-4" 
                onClick={() => fetchCharactersMutation.mutate()}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('character.fetch_from_bnet')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {characters.map((character: Character) => (
              <div 
                key={character.id}
                className="relative rounded-lg p-4 transition-all hover:scale-[1.02]"
                style={{ 
                  backgroundColor: getClassColor(character.class),
                  borderLeft: `4px solid ${getClassTextColor(character.class)}` 
                }}
              >
                {/* Character Avatar */}
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary-foreground">
                    <AvatarImage 
                      src={character.avatarUrl || ''} 
                      alt={character.name} 
                    />
                    <AvatarFallback className="bg-primary">
                      {character.name.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="space-y-1">
                    <h3 className="font-semibold text-lg flex items-center">
                      {character.name}
                      {character.isMain && (
                        <Trophy className="h-4 w-4 ml-2 text-amber-500" />
                      )}
                      {character.verified && (
                        <Shield className="h-4 w-4 ml-1 text-green-500" />
                      )}
                    </h3>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" style={{ color: getClassTextColor(character.class) }}>
                        {character.class}
                      </Badge>
                      <Badge variant="outline">
                        {character.realm}
                      </Badge>
                      <Badge>
                        {t('character.level')} {character.level}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-3 flex justify-end">
                  {!character.isMain && (
                    <Button 
                      size="sm" 
                      variant="secondary"
                      onClick={() => setMainCharacter(character.id)}
                      disabled={setMainCharacterMutation.isPending}
                    >
                      {setMainCharacterMutation.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                      {t('character.set_as_main')}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t pt-4">
        {mainCharacter ? (
          <p className="text-sm text-muted-foreground">
            {t('character.main_character')}: <span className="font-semibold">{mainCharacter.name}</span> ({mainCharacter.realm})
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {hasCharacters ? t('character.no_main_set') : t('character.no_characters_yet')}
          </p>
        )}
      </CardFooter>
    </Card>
  );
}