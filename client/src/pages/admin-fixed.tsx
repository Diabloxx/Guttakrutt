import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { RaidBoss } from '@shared/schema';
import { format } from 'date-fns';
import {
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  Users, 
  Key, 
  FileText,
  Trash2, 
  Edit,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';

// Helper function to handle boss icon URLs
function getIconUrl(iconUrl: string | null) {
  if (!iconUrl) {
    return "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  }
  
  if (iconUrl.startsWith('http')) {
    return iconUrl;
  }
  
  return `https://wow.zamimg.com/images/wow/icons/large/${iconUrl}.jpg`;
}

// Helper function to determine class color
function getClassColor(className: string): string {
  const classColors: Record<string, string> = {
    "Death Knight": "text-[#C41E3A]", // Red
    "Demon Hunter": "text-[#A330C9]", // Purple
    "Druid": "text-[#FF7C0A]", // Orange
    "Evoker": "text-[#33937F]", // Teal
    "Hunter": "text-[#AAD372]", // Green
    "Mage": "text-[#3FC7EB]", // Light Blue
    "Monk": "text-[#00FF98]", // Jade
    "Paladin": "text-[#F48CBA]", // Pink
    "Priest": "text-[#FFFFFF]", // White
    "Rogue": "text-[#FFF468]", // Yellow
    "Shaman": "text-[#0070DD]", // Blue
    "Warlock": "text-[#8788EE]", // Purple
    "Warrior": "text-[#C69B6D]", // Tan
  };

  return classColors[className] || "text-gray-200";
}

interface BossResponse {
  bosses: RaidBoss[];
  apiStatus: string;
  lastUpdated: string;
}

interface BossUpdateResponse {
  boss: RaidBoss;
  message: string;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState<string>("raid-progress");
  const [selectedRaid, setSelectedRaid] = useState<string>("Liberation of Undermine");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("mythic");
  
  // Check admin authentication status
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ['/api/admin/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/status');
      return await response.json();
    }
  });
  
  // Fetch raid bosses
  const { 
    data: bossesData, 
    isLoading: isLoadingBosses, 
    refetch: refetchBosses 
  } = useQuery<BossResponse>({
    queryKey: ['/api/raid-bosses', selectedRaid, selectedDifficulty],
    queryFn: async () => {
      const response = await apiRequest(
        'GET', 
        `/api/raid-bosses?raid=${encodeURIComponent(selectedRaid)}&difficulty=${selectedDifficulty}`
      );
      return response.json();
    },
    enabled: !!authData?.loggedIn
  });
  
  // Mutation to update boss information
  const updateBossMutation = useMutation({
    mutationFn: async ({ bossId, updateData }: { bossId: number; updateData: any }) => {
      const response = await apiRequest('PATCH', `/api/raid-bosses/${bossId}`, updateData);
      return response.json();
    },
    onSuccess: (data: BossUpdateResponse) => {
      toast({
        title: "Success",
        description: data.message || "Boss updated successfully",
      });
      refetchBosses();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update boss: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to refresh all data
  const refreshAllDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/refresh-data', {
        raid: selectedRaid,
        difficulty: selectedDifficulty
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "All data refreshed successfully",
      });
      refetchBosses();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to refresh data: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Get bosses from data
  const bosses = bossesData?.bosses || [];
  
  // Handler for boss data updates
  const handleBossUpdate = (boss: RaidBoss, field: string, value: any) => {
    const updateData = { [field]: value };
    
    // For lastKillDate, make sure to format it as an ISO date string
    if (field === 'lastKillDate' && value) {
      try {
        updateData[field] = new Date(value).toISOString();
      } catch (e) {
        console.error("Invalid date format", e);
        return;
      }
    }
    
    updateBossMutation.mutate({ bossId: boss.id, updateData });
  };
  
  // Handle user logout
  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/admin/logout');
      window.location.reload();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };
  
  // Render login form for unauthenticated users
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
      </div>
    );
  }
  
  if (!authData?.loggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black"
        style={{
          backgroundImage: `url('/assets/wow-background.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
        <Card className="w-full max-w-md z-10 bg-black/80 border-wow-gold/40 shadow-xl">
          <CardHeader className="space-y-1 bg-gradient-to-r from-green-900/50 to-green-950/80 border-b border-wow-gold/30">
            <CardTitle className="text-2xl text-center text-wow-gold font-wow">GUTTAKRUTT ADMIN</CardTitle>
            <CardDescription className="text-center text-wow-light/80">
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form id="login-form" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const username = formData.get('username') as string;
              const password = formData.get('password') as string;
              
              try {
                const response = await apiRequest('POST', '/api/admin/login', { username, password });
                const data = await response.json();
                
                if (data.success) {
                  window.location.reload();
                } else {
                  toast({
                    title: "Authentication Failed",
                    description: data.message || "Invalid username or password",
                    variant: "destructive",
                  });
                }
              } catch (error) {
                console.error("Login error", error);
                toast({
                  title: "Authentication Failed",
                  description: "An error occurred during login. Please try again.",
                  variant: "destructive",
                });
              }
            }}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-wow-gold">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Enter your username"
                    required
                    className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-wow-gold">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    required
                    className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit"
              form="login-form"
              className="w-full bg-gradient-to-r from-green-800 to-green-900 hover:from-green-700 hover:to-green-800 text-wow-light border border-green-700/50 shadow-md"
            >
              Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Render admin panel for authenticated users
  return (
    <div 
      className="min-h-screen bg-black"
      style={{
        backgroundImage: `url('/assets/wow-background.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Hero Section with Guild Logo */}
      <div className="relative bg-gradient-to-b from-black/50 via-transparent to-black/80 overflow-hidden border-b border-wow-gold/30">
        <div 
          className="w-full h-64 md:h-80 flex flex-col items-center justify-center relative bg-cover bg-center"
          style={{
            backgroundImage: `url('/assets/guild-banner.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div className="z-10 text-center">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-wow text-wow-gold tracking-wider mb-4 text-shadow-lg">
              GUTTAKRUTT
            </h1>
            <h2 className="text-3xl md:text-4xl text-wow-gold font-wow tracking-wide mb-6 text-shadow-md">
              ADMIN PANEL
            </h2>
            <p className="text-lg md:text-xl text-wow-light max-w-xl mx-auto px-4">
              Manage guild progression, members, applications, translations and content
            </p>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto py-10 px-4 max-w-7xl">
        <Card className="mb-8 bg-black/70 backdrop-blur-sm border-wow-gold/30 shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-900/50 to-green-950/90 border-b border-wow-gold/40 pb-6 px-8">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-wow-gold text-3xl font-wow">
                  Guttakrutt Admin Panel
                </CardTitle>
                <CardDescription className="text-wow-light/90 mt-1 text-base">
                  Manage guild progression, members, applications, and users
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={handleLogout}
                  className="bg-red-900/80 hover:bg-red-800 text-wow-light border border-red-700/50 shadow-md"
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="bg-black/80 border-b border-wow-gold/30 shadow-md">
                <TabsList className="flex justify-center space-x-1 p-1 bg-transparent">
                  <TabsTrigger 
                    value="raid-progress" 
                    className="flex-1 bg-black/20 hover:bg-green-800/20 text-lg py-3 font-medium text-wow-light data-[state=active]:bg-green-800/30 data-[state=active]:text-wow-gold border-b-2 border-transparent data-[state=active]:border-wow-gold transition-all rounded-none"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Raid Progress
                  </TabsTrigger>
                  <TabsTrigger 
                    value="members" 
                    className="flex-1 bg-black/20 hover:bg-green-800/20 text-lg py-3 font-medium text-wow-light data-[state=active]:bg-green-800/30 data-[state=active]:text-wow-gold border-b-2 border-transparent data-[state=active]:border-wow-gold transition-all rounded-none"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Guild Members
                  </TabsTrigger>
                  <TabsTrigger 
                    value="applications" 
                    className="flex-1 bg-black/20 hover:bg-green-800/20 text-lg py-3 font-medium text-wow-light data-[state=active]:bg-green-800/30 data-[state=active]:text-wow-gold border-b-2 border-transparent data-[state=active]:border-wow-gold transition-all rounded-none"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Applications
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="flex-1 bg-black/20 hover:bg-green-800/20 text-lg py-3 font-medium text-wow-light data-[state=active]:bg-green-800/30 data-[state=active]:text-wow-gold border-b-2 border-transparent data-[state=active]:border-wow-gold transition-all rounded-none"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Admin Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="content"
                    className="flex-1 bg-black/20 hover:bg-green-800/20 text-lg py-3 font-medium text-wow-light data-[state=active]:bg-green-800/30 data-[state=active]:text-wow-gold border-b-2 border-transparent data-[state=active]:border-wow-gold transition-all rounded-none"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Content Management
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {/* Raid Progress Tab */}
              <TabsContent value="raid-progress" className="px-6 pb-6">
                <div className="bg-black/40 border border-green-900/50 rounded-lg p-6 mb-8 shadow-md">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mb-6">
                    <div>
                      <Label htmlFor="raid-select" className="text-wow-gold mb-2 block font-medium">Raid</Label>
                      <Select
                        value={selectedRaid}
                        onValueChange={setSelectedRaid}
                      >
                        <SelectTrigger id="raid-select" className="bg-black/70 border-wow-gold/30 text-wow-light">
                          <SelectValue placeholder="Select Raid" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                          <SelectItem value="Liberation of Undermine">Liberation of Undermine</SelectItem>
                          <SelectItem value="Nerub-ar Palace">Nerub-ar Palace</SelectItem>
                          <SelectItem value="Blackrock Depths">Blackrock Depths</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="difficulty-select" className="text-wow-gold mb-2 block font-medium">Difficulty</Label>
                      <Select
                        value={selectedDifficulty}
                        onValueChange={setSelectedDifficulty}
                      >
                        <SelectTrigger id="difficulty-select" className="bg-black/70 border-wow-gold/30 text-wow-light">
                          <SelectValue placeholder="Select Difficulty" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                          <SelectItem value="mythic">Mythic</SelectItem>
                          <SelectItem value="heroic">Heroic</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 bg-green-900/50 hover:bg-green-800/60 text-wow-gold border-wow-gold/30 shadow-sm transition-all"
                      onClick={() => refreshAllDataMutation.mutate()}
                      disabled={refreshAllDataMutation.isPending}
                    >
                      {refreshAllDataMutation.isPending ? (
                        <>
                          <span>Refreshing Data...</span>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        </>
                      ) : (
                        <>
                          <span>Refresh All Data</span>
                          <RefreshCw className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {isLoadingBosses ? (
                  <div className="flex justify-center my-10">
                    <div className="w-10 h-10 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-lg"></div>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full space-y-6">
                    {bosses.map((boss) => (
                      <AccordionItem 
                        key={boss.id} 
                        value={boss.id.toString()} 
                        className={`
                          bg-gradient-to-b from-black/80 to-black/50 
                          rounded-xl border border-wow-gold/30 shadow-lg overflow-hidden
                          ${boss.defeated ? 'border-green-600/40' : boss.inProgress ? 'border-amber-500/40' : 'border-wow-gold/20'}
                        `}
                      >
                        <AccordionTrigger className={`
                          px-6 py-4 hover:bg-green-900/10 rounded-t-xl transition-all
                          ${boss.defeated ? 'bg-green-900/20' : boss.inProgress ? 'bg-amber-900/20' : 'bg-black/40'}
                        `}>
                          <div className="flex items-center w-full">
                            <div className="relative">
                              <img
                                src={getIconUrl(boss.iconUrl)}
                                alt={boss.name}
                                className="w-14 h-14 mr-5 rounded-lg border border-wow-gold/40 shadow-md"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                                }}
                              />
                              {boss.defeated && (
                                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-md border border-green-400">
                                  <CheckCircle className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-left flex-1">
                              <h3 className="font-semibold text-lg text-wow-gold">{boss.name}</h3>
                              <div className="text-sm text-wow-light/70 flex items-center mt-1">
                                {boss.defeated ? (
                                  <span className="text-green-400 flex items-center">
                                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                    Defeated {boss.lastKillDate && `on ${format(new Date(boss.lastKillDate), 'MMM d, yyyy')}`}
                                  </span>
                                ) : boss.pullCount && boss.pullCount > 0 ? (
                                  <span className="text-amber-400 flex items-center">
                                    <Clock className="w-3.5 h-3.5 mr-1" />
                                    In Progress ({boss.pullCount} pulls)
                                  </span>
                                ) : (
                                  <span className="text-wow-light/50 flex items-center">
                                    <XCircle className="w-3.5 h-3.5 mr-1" />
                                    Not Started
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-6 pt-4 border-t border-wow-gold/20 bg-black/20">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                              <div className="bg-white/95 border border-wow-gold/20 rounded-lg p-4 mb-4">
                                <h4 className="text-wow-gold mb-3 font-medium">Boss Status</h4>
                                <Label htmlFor={`defeated-${boss.id}`} className="flex items-center space-x-2 mb-4 cursor-pointer hover:text-wow-gold transition-colors text-gray-800">
                                  <Checkbox 
                                    id={`defeated-${boss.id}`} 
                                    checked={boss.defeated || false}
                                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                    onCheckedChange={(checked) => {
                                      // If boss is marked as defeated, automatically set inProgress to false
                                      if (checked) {
                                        handleBossUpdate(boss, 'inProgress', false);
                                      }
                                      handleBossUpdate(boss, 'defeated', checked);
                                    }}
                                  />
                                  <span>Boss Defeated</span>
                                </Label>
                                
                                <Label htmlFor={`in-progress-${boss.id}`} className="flex items-center space-x-2 mb-4 cursor-pointer hover:text-wow-gold transition-colors text-gray-800">
                                  <Checkbox 
                                    id={`in-progress-${boss.id}`} 
                                    checked={boss.inProgress || false}
                                    disabled={boss.defeated || false} // Can't be in progress if defeated
                                    className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600"
                                    onCheckedChange={(checked) => handleBossUpdate(boss, 'inProgress', checked)}
                                  />
                                  <span>In Progress</span>
                                </Label>
                                
                                <div className="mb-0">
                                  <Label htmlFor={`pulls-${boss.id}`} className="text-gray-800 mb-1.5 block">
                                    Pull Count
                                  </Label>
                                  <Input
                                    id={`pulls-${boss.id}`}
                                    type="number"
                                    min="0"
                                    value={boss.pullCount || 0}
                                    className="bg-white text-gray-900 border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30"
                                    onChange={(e) => handleBossUpdate(boss, 'pullCount', parseInt(e.target.value, 10))}
                                  />
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="bg-white/95 border border-wow-gold/20 rounded-lg p-4">
                                <h4 className="text-wow-gold mb-3 font-medium">Performance Data</h4>
                                <div className="mb-4">
                                  <Label htmlFor={`best-time-${boss.id}`} className="text-gray-800 mb-1.5 block">
                                    Best Kill Time (MM:SS)
                                  </Label>
                                  <Input
                                    id={`best-time-${boss.id}`}
                                    value={boss.bestTime || ""}
                                    placeholder="e.g. 5:42"
                                    className="bg-white text-gray-900 border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30"
                                    onChange={(e) => handleBossUpdate(boss, 'bestTime', e.target.value)}
                                  />
                                </div>
                                
                                <div className="mb-4">
                                  <Label htmlFor={`best-parse-${boss.id}`} className="text-gray-800 mb-1.5 block">
                                    Best Parse
                                  </Label>
                                  <Input
                                    id={`best-parse-${boss.id}`}
                                    value={boss.bestParse || ""}
                                    placeholder="e.g. 92"
                                    className="bg-white text-gray-900 border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30"
                                    onChange={(e) => handleBossUpdate(boss, 'bestParse', e.target.value)}
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`last-kill-date-${boss.id}`} className="text-gray-800 mb-1.5 block">
                                    Last Kill Date
                                  </Label>
                                  <Input
                                    id={`last-kill-date-${boss.id}`}
                                    type="date"
                                    value={boss.lastKillDate ? new Date(boss.lastKillDate).toISOString().split('T')[0] : ""}
                                    className="bg-white text-gray-900 border-wow-gold/30 focus:border-wow-gold focus:ring-wow-gold/30"
                                    onChange={(e) => handleBossUpdate(boss, 'lastKillDate', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </TabsContent>
              
              {/* Other tabs will be implemented later */}
              <TabsContent value="members" className="px-6 pb-6">
                <div className="bg-black/40 border border-green-900/50 rounded-lg p-6 mb-8 shadow-md">
                  <h2 className="text-xl text-wow-gold font-semibold">Coming Soon</h2>
                  <p className="text-wow-light/70">Guild members management will be available soon.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="applications" className="px-6 pb-6">
                <div className="bg-black/40 border border-green-900/50 rounded-lg p-6 mb-8 shadow-md">
                  <h2 className="text-xl text-wow-gold font-semibold">Coming Soon</h2>
                  <p className="text-wow-light/70">Applications management will be available soon.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="users" className="px-6 pb-6">
                <div className="bg-black/40 border border-green-900/50 rounded-lg p-6 mb-8 shadow-md">
                  <h2 className="text-xl text-wow-gold font-semibold">Coming Soon</h2>
                  <p className="text-wow-light/70">Admin user management will be available soon.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="px-6 pb-6">
                <div className="bg-black/40 border border-green-900/50 rounded-lg p-6 mb-8 shadow-md">
                  <h2 className="text-xl text-wow-gold font-semibold">Coming Soon</h2>
                  <p className="text-wow-light/70">Content management will be available soon.</p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-gradient-to-r from-green-950/90 to-green-900/30 border-t border-wow-gold/30 px-8 py-4">
            <div className="flex justify-between items-center w-full">
              <div className="text-wow-light/70 text-sm">
                <p>Guttakrutt Admin Panel • {new Date().getFullYear()}</p>
              </div>
              <div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-wow-light/70 hover:text-wow-light hover:bg-black/20"
                >
                  Logout
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}