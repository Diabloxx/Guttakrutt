import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { RaidBoss, Application, ApplicationComment } from '@shared/schema';
import { format } from 'date-fns';

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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  User, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MessageSquare 
} from 'lucide-react';

interface BossResponse {
  bosses: RaidBoss[];
  apiStatus: string;
  lastUpdated: string;
}

interface BossUpdateResponse {
  boss: RaidBoss;
  message: string;
}

interface AdminAuthStatus {
  authenticated: boolean;
  username?: string;
}

export default function Admin() {
  const [selectedRaid, setSelectedRaid] = useState<string>("Liberation of Undermine");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("mythic");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Check authentication status on load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/status');
        const data = await response.json();
        setIsAuthenticated(data.loggedIn === true);
      } catch (error) {
        console.error("Failed to check authentication status:", error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      setIsLoggingIn(true);
      const response = await apiRequest('POST', '/api/admin/login', credentials);
      return await response.json();
    },
    onSuccess: (data) => {
      setIsAuthenticated(true);
      toast({
        title: "Logged in successfully",
        description: "Welcome to the admin panel",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive"
      });
      console.error("Login error:", error);
    },
    onSettled: () => {
      setIsLoggingIn(false);
    }
  });
  
  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/logout');
      return await response.json();
    },
    onSuccess: () => {
      setIsAuthenticated(false);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Logout failed",
        description: "An error occurred during logout",
        variant: "destructive"
      });
      console.error("Logout error:", error);
    }
  });
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password });
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fetch bosses for selected raid and difficulty
  const { data, isLoading } = useQuery<BossResponse>({
    queryKey: ['/api/raid-bosses', selectedRaid, selectedDifficulty],
    queryFn: async ({ queryKey }) => {
      const params = new URLSearchParams({
        raid: selectedRaid,
        difficulty: selectedDifficulty 
      });
      const response = await apiRequest('GET', `/api/raid-bosses?${params.toString()}`);
      return await response.json();
    },
    enabled: !!selectedRaid && !!selectedDifficulty
  });

  const bosses = data?.bosses || [];

  // Mutation for updating boss data
  const updateBossMutation = useMutation<BossUpdateResponse, Error, Partial<RaidBoss> & { id: number }>({
    mutationFn: async (bossData) => {
      const response = await apiRequest('PATCH', `/api/raid-bosses/${bossData.id}`, bossData);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Boss information updated successfully!",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/raid-bosses'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update boss information. Please try again.",
        variant: "destructive"
      });
      console.error("Error updating boss:", error);
    }
  });

  // Handle boss update
  const handleBossUpdate = (boss: RaidBoss, field: string, value: any) => {
    const updateData = {
      id: boss.id,
      [field]: value
    };
    
    // Show toast with the data being sent
    toast({
      title: "Updating Boss",
      description: `Field: ${field}, Value: ${JSON.stringify(value)}`,
      variant: "default"
    });
    
    updateBossMutation.mutate(updateData);
  };

  // Render login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10 px-4 flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-wow-gold">Admin Login</CardTitle>
            <CardDescription>
              Login to access the raid progression management panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="mb-6">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <span className="mr-2">Logging in...</span>
                    <div className="w-4 h-4 border-2 border-white rounded-full border-t-transparent animate-spin"></div>
                  </>
                ) : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Add state for applications filtering
  const [applicationFilter, setApplicationFilter] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState<string>("");
  const [commentText, setCommentText] = useState<string>("");
  
  // Fetch applications
  const { 
    data: applicationsData, 
    isLoading: isLoadingApplications, 
    isError: isApplicationsError 
  } = useQuery<{ applications: Application[] }>({
    queryKey: ['/api/applications', applicationFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (applicationFilter !== 'all') {
        params.append('status', applicationFilter);
      }
      const response = await apiRequest('GET', `/api/applications${params.toString() ? `?${params.toString()}` : ''}`);
      return await response.json();
    },
    enabled: isAuthenticated,
  });
  
  // Fetch application comments when an application is selected
  const { 
    data: commentsData, 
    isLoading: isLoadingComments,
    isError: isCommentsError 
  } = useQuery<{ comments: any[] }>({
    queryKey: ['/api/applications', selectedApplication?.id, 'comments'],
    queryFn: async () => {
      if (!selectedApplication) return { comments: [] };
      const response = await apiRequest('GET', `/api/applications/${selectedApplication.id}/comments`);
      return await response.json();
    },
    enabled: !!selectedApplication,
  });
  
  // Application status update mutation
  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ 
      id, status, reviewNotes 
    }: { 
      id: number; 
      status: string; 
      reviewNotes?: string 
    }) => {
      const response = await apiRequest(
        'PATCH', 
        `/api/applications/${id}/status`, 
        { status, reviewNotes }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status Updated",
        description: "Application status has been updated successfully",
        variant: "default"
      });
      setSelectedApplication(null);
      setReviewNote("");
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update application status",
        variant: "destructive"
      });
      console.error("Error updating application status:", error);
    }
  });
  
  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ id, comment }: { id: number; comment: string }) => {
      const response = await apiRequest(
        'POST', 
        `/api/applications/${id}/comments`, 
        { comment }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the application",
        variant: "default"
      });
      setCommentText("");
      queryClient.invalidateQueries({ queryKey: ['/api/applications'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
      console.error("Error adding comment:", error);
    }
  });
  
  // Handle application status change
  const handleStatusChange = (status: string) => {
    if (!selectedApplication) return;
    
    updateApplicationStatusMutation.mutate({
      id: selectedApplication.id,
      status,
      reviewNotes: reviewNote
    });
  };
  
  // Handle adding a comment
  const handleAddComment = () => {
    if (!selectedApplication || !commentText.trim()) return;
    
    addCommentMutation.mutate({
      id: selectedApplication.id,
      comment: commentText
    });
  };
  
  // Render admin panel for authenticated users
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-wow-gold">Guttakrutt Admin Panel</CardTitle>
          <CardDescription>
            Manage guild progression, applications, and recruitment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="raid-progress" className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="raid-progress" className="text-lg">
                <i className="fas fa-trophy mr-2"></i>
                Raid Progress
              </TabsTrigger>
              <TabsTrigger value="applications" className="text-lg">
                <User className="w-4 h-4 mr-2" />
                Applications
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="raid-progress">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">
                <div>
                  <Label htmlFor="raid-select">Raid</Label>
                  <Select
                    value={selectedRaid}
                    onValueChange={setSelectedRaid}
                  >
                    <SelectTrigger id="raid-select">
                      <SelectValue placeholder="Select Raid" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Liberation of Undermine">Liberation of Undermine</SelectItem>
                      <SelectItem value="Nerub-ar Palace">Nerub-ar Palace</SelectItem>
                      <SelectItem value="Blackrock Depths">Blackrock Depths</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="difficulty-select">Difficulty</Label>
                  <Select
                    value={selectedDifficulty}
                    onValueChange={setSelectedDifficulty}
                  >
                    <SelectTrigger id="difficulty-select">
                      <SelectValue placeholder="Select Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mythic">Mythic</SelectItem>
                      <SelectItem value="heroic">Heroic</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="flex justify-center my-10">
                  <div className="w-8 h-8 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                </div>
              ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {bosses.map((boss) => (
                    <AccordionItem key={boss.id} value={boss.id.toString()} className="bg-wow-dark/70 rounded-lg border border-wow-gold/10">
                      <AccordionTrigger className="px-4 hover:bg-wow-dark/90 rounded-t-lg">
                        <div className="flex items-center">
                          <img
                            src={getIconUrl(boss.iconUrl)}
                            alt={boss.name}
                            className="w-10 h-10 mr-4 rounded-md border border-wow-gold/30"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                            }}
                          />
                          <div className="text-left">
                            <h3 className="font-semibold">{boss.name}</h3>
                            <p className="text-xs text-wow-light/60">
                              {boss.defeated ? (
                                <span className="text-green-400">Defeated</span>
                              ) : boss.pullCount && boss.pullCount > 0 ? (
                                <span className="text-amber-400">In Progress ({boss.pullCount} pulls)</span>
                              ) : (
                                <span className="text-wow-light/50">Not Started</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-4 pt-2 border-t border-wow-gold/10">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor={`defeated-${boss.id}`} className="flex items-center space-x-2 mb-4">
                              <Checkbox 
                                id={`defeated-${boss.id}`} 
                                checked={boss.defeated || false}
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
                            
                            <Label htmlFor={`in-progress-${boss.id}`} className="flex items-center space-x-2 mb-4">
                              <Checkbox 
                                id={`in-progress-${boss.id}`} 
                                checked={boss.inProgress || false}
                                disabled={boss.defeated || false} // Can't be in progress if defeated
                                onCheckedChange={(checked) => handleBossUpdate(boss, 'inProgress', checked)}
                              />
                              <span>In Progress</span>
                            </Label>
                            
                            <div className="mb-4">
                              <Label htmlFor={`pulls-${boss.id}`}>Pull Count</Label>
                              <Input
                                id={`pulls-${boss.id}`}
                                type="number"
                                min="0"
                                value={boss.pullCount || 0}
                                onChange={(e) => handleBossUpdate(boss, 'pullCount', parseInt(e.target.value, 10))}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <div className="mb-4">
                              <Label htmlFor={`best-time-${boss.id}`}>Best Kill Time (MM:SS)</Label>
                              <Input
                                id={`best-time-${boss.id}`}
                                value={boss.bestTime || ""}
                                placeholder="e.g. 5:42"
                                onChange={(e) => handleBossUpdate(boss, 'bestTime', e.target.value)}
                              />
                            </div>
                            
                            <div className="mb-4">
                              <Label htmlFor={`best-parse-${boss.id}`}>Best Parse (%)</Label>
                              <Input
                                id={`best-parse-${boss.id}`}
                                value={boss.bestParse || ""}
                                placeholder="e.g. 95.3%"
                                onChange={(e) => handleBossUpdate(boss, 'bestParse', e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor={`last-kill-${boss.id}`}>Last Kill Date</Label>
                          <Input
                            id={`last-kill-${boss.id}`}
                            type="date"
                            value={boss.lastKillDate ? new Date(boss.lastKillDate).toISOString().slice(0, 10) : ""}
                            onChange={(e) => {
                              // Just send the date string, not a Date object
                              handleBossUpdate(boss, 'lastKillDate', e.target.value || null);
                            }}
                          />
                        </div>
                        
                        <div className="mt-4">
                          <Label htmlFor={`icon-${boss.id}`}>
                            Boss Icon 
                            <span className="ml-1 text-xs text-wow-light/50">
                              (Enter icon name like "inv_misc_head_dragon_black" or full URL)
                            </span>
                          </Label>
                          <Input
                            id={`icon-${boss.id}`}
                            value={boss.iconUrl || ""}
                            placeholder="e.g. inv_misc_head_dragon_black"
                            onChange={(e) => handleBossUpdate(boss, 'iconUrl', e.target.value)}
                          />
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </TabsContent>
            
            <TabsContent value="applications">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <Label htmlFor="status-filter">Filter Applications</Label>
                  <Select
                    value={applicationFilter}
                    onValueChange={setApplicationFilter}
                  >
                    <SelectTrigger id="status-filter" className="w-[200px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Applications</SelectItem>
                      <SelectItem value="pending">Pending Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <span className="text-sm text-wow-light/70">
                  {isLoadingApplications ? 'Loading...' : 
                   applicationsData?.applications?.length 
                   ? `${applicationsData.applications.length} applications found` 
                   : 'No applications found'}
                </span>
              </div>
              
              {isLoadingApplications ? (
                <div className="flex justify-center my-10">
                  <div className="w-8 h-8 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                </div>
              ) : isApplicationsError ? (
                <div className="p-8 text-center text-wow-light/70">
                  <p>Failed to load applications. Please try again.</p>
                </div>
              ) : !applicationsData?.applications?.length ? (
                <div className="p-8 text-center text-wow-light/70">
                  <p>No applications found with the selected filter.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Character</TableHead>
                      <TableHead>Class / Spec</TableHead>
                      <TableHead>Item Level</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applicationsData.applications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell className="font-medium">
                          {app.characterName}
                          <div className="text-xs text-wow-light/60">{app.realm}</div>
                        </TableCell>
                        <TableCell className={`text-${app.className?.toLowerCase() || 'wow-light'}`}>
                          {app.className} / {app.specName}
                        </TableCell>
                        <TableCell>{app.itemLevel}</TableCell>
                        <TableCell>
                          {app.status === 'pending' && (
                            <Badge variant="outline" className="bg-amber-950/30 text-amber-300 border-amber-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Pending
                            </Badge>
                          )}
                          {app.status === 'approved' && (
                            <Badge variant="outline" className="bg-green-950/30 text-green-300 border-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approved
                            </Badge>
                          )}
                          {app.status === 'rejected' && (
                            <Badge variant="outline" className="bg-red-950/30 text-red-300 border-red-800">
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejected
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {app.createdAt && format(new Date(app.createdAt), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedApplication(app)}
                              >
                                View
                              </Button>
                            </DialogTrigger>
                            {selectedApplication && selectedApplication.id === app.id && (
                              <DialogContent className="max-w-3xl bg-wow-dark text-wow-light border-wow-gold/20">
                                <DialogHeader>
                                  <DialogTitle className="text-wow-gold">Application: {app.characterName}</DialogTitle>
                                  <DialogDescription className="text-wow-light/70">
                                    Submitted on {app.createdAt && format(new Date(app.createdAt), 'MMMM d, yyyy')}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-wow-gold/80">Character</Label>
                                      <p className="text-wow-light">{app.characterName}</p>
                                    </div>
                                    <div>
                                      <Label className="text-wow-gold/80">Realm</Label>
                                      <p className="text-wow-light">{app.realm}</p>
                                    </div>
                                    <div>
                                      <Label className="text-wow-gold/80">Class / Spec</Label>
                                      <p className={`text-${app.className?.toLowerCase() || 'wow-light'}`}>
                                        {app.className} / {app.specName}
                                      </p>
                                    </div>
                                    <div>
                                      <Label className="text-wow-gold/80">Item Level</Label>
                                      <p className="text-wow-light">{app.itemLevel}</p>
                                    </div>
                                    <div>
                                      <Label className="text-wow-gold/80">Contact Info</Label>
                                      <p className="text-wow-light">{app.contactInfo}</p>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div>
                                      <Label className="text-wow-gold/80">Experience</Label>
                                      <p className="text-wow-light text-sm">{app.experience}</p>
                                    </div>
                                    <div>
                                      <Label className="text-wow-gold/80">Availability</Label>
                                      <p className="text-wow-light text-sm">{app.availability}</p>
                                    </div>
                                    <div>
                                      <Label className="text-wow-gold/80">Why Join Guttakrutt</Label>
                                      <p className="text-wow-light text-sm">{app.whyJoin}</p>
                                    </div>
                                    {app.logs && (
                                      <div>
                                        <Label className="text-wow-gold/80">Logs</Label>
                                        <p className="text-wow-light text-sm break-all">
                                          <a href={app.logs} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                                            {app.logs}
                                          </a>
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {app.additionalInfo && (
                                  <div className="py-2">
                                    <Label className="text-wow-gold/80">Additional Information</Label>
                                    <p className="text-wow-light text-sm">{app.additionalInfo}</p>
                                  </div>
                                )}
                                
                                <div className="py-2">
                                  <Label className="text-wow-gold/80">Review Notes</Label>
                                  <Textarea 
                                    value={reviewNote} 
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="Add notes about this application (only visible to admins)"
                                    className="bg-wow-secondary/50 border-wow-gold/30 mt-2"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-3 gap-2 py-4">
                                  <Button
                                    onClick={() => handleStatusChange('approved')}
                                    disabled={app.status === 'approved'}
                                    className="bg-green-700 hover:bg-green-600 text-white"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusChange('rejected')}
                                    disabled={app.status === 'rejected'}
                                    className="bg-red-700 hover:bg-red-600 text-white"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => handleStatusChange('pending')}
                                    disabled={app.status === 'pending'}
                                    className="bg-amber-700 hover:bg-amber-600 text-white"
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Mark Pending
                                  </Button>
                                </div>
                                
                                {/* Display existing comments */}
                                {selectedApplication && (
                                  <div className="py-4 border-t border-wow-gold/20">
                                    <Label className="text-wow-gold/80 flex items-center mb-3">
                                      <MessageSquare className="w-4 h-4 mr-2" />
                                      Comments
                                    </Label>
                                    
                                    {isLoadingComments ? (
                                      <div className="flex justify-center my-2">
                                        <div className="w-5 h-5 border-2 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                                      </div>
                                    ) : isCommentsError ? (
                                      <p className="text-red-400 text-sm">Failed to load comments</p>
                                    ) : !commentsData?.comments?.length ? (
                                      <p className="text-wow-light/60 text-sm italic">No comments yet</p>
                                    ) : (
                                      <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                                        {commentsData.comments.map((comment: any) => (
                                          <div key={comment.id} className="bg-wow-secondary/30 p-3 rounded-md border border-wow-gold/10">
                                            <div className="flex justify-between items-start mb-1">
                                              <span className="text-wow-gold/80 text-sm font-medium">
                                                Admin
                                              </span>
                                              <span className="text-wow-light/50 text-xs">
                                                {comment.createdAt && format(new Date(comment.createdAt), 'MMM d, yyyy HH:mm')}
                                              </span>
                                            </div>
                                            <p className="text-wow-light text-sm">{comment.comment}</p>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}
                                
                                {/* Add new comment */}
                                <div className="pt-4 border-t border-wow-gold/20">
                                  <Label className="text-wow-gold/80 flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Add Comment
                                  </Label>
                                  <div className="flex mt-2">
                                    <Textarea 
                                      value={commentText} 
                                      onChange={(e) => setCommentText(e.target.value)}
                                      placeholder="Add a comment about this application"
                                      className="bg-wow-secondary/50 border-wow-gold/30 flex-grow mr-2"
                                    />
                                    <Button onClick={handleAddComment} className="self-end">
                                      Post
                                    </Button>
                                  </div>
                                </div>
                                
                                <DialogFooter className="pt-4">
                                  <DialogClose asChild>
                                    <Button variant="outline">Close</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            )}
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="destructive" onClick={handleLogout}>Logout</Button>
        </CardFooter>
      </Card>
    </div>
  );
}