import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';
import { RaidBoss, Character, Application, ApplicationComment } from '@shared/schema';
import GuildLogo from '@/components/GuildLogo';
import LogsPanel from '@/components/admin/LogsPanel';
import ErrorTester from '@/components/ErrorTester';
import { format } from 'date-fns';
import {
  Home,
  Users,
  Award,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  FileText,
  AlertTriangle,
  Eye,
  Edit,
  Save,
  Trash2 as Trash,
  Plus,
  UserPlus,
  Bell,
  BarChart3,
  AreaChart,
  PieChart,
  LineChart,
  Activity,
  BookOpen,
  Lock,
  Shield,
  FileImage,
  Globe,
  Languages,
  Coffee,
  Crown,
  MoreVertical,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  Loader2,
  Send,
  Star,
  ListFilter,
  Trophy,
  FileSearch,
  GanttChart
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Helper utilities

// Function to convert class name to color
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

// Function to get class color bg with opacity
function getClassBgColor(className: string): string {
  const classBgColors: Record<string, string> = {
    "Death Knight": "bg-[#C41E3A]/20", // Red
    "Demon Hunter": "bg-[#A330C9]/20", // Purple
    "Druid": "bg-[#FF7C0A]/20", // Orange
    "Evoker": "bg-[#33937F]/20", // Teal
    "Hunter": "bg-[#AAD372]/20", // Green
    "Mage": "bg-[#3FC7EB]/20", // Light Blue
    "Monk": "bg-[#00FF98]/20", // Jade
    "Paladin": "bg-[#F48CBA]/20", // Pink
    "Priest": "bg-[#FFFFFF]/20", // White
    "Rogue": "bg-[#FFF468]/20", // Yellow
    "Shaman": "bg-[#0070DD]/20", // Blue
    "Warlock": "bg-[#8788EE]/20", // Purple
    "Warrior": "bg-[#C69B6D]/20", // Tan
  };

  return classBgColors[className] || "bg-gray-200/20";
}

// Function to get boss icon URL with improved error handling
function getIconUrl(iconUrl: string | null) {
  if (!iconUrl) {
    return "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  }
  
  try {
    if (iconUrl.startsWith('http')) {
      // For wikia URLs that often cause problems, replace with fallback
      if (iconUrl.includes('wikia.nocookie.net')) {
        // Extract the icon name from the URL to create a safer version
        const iconName = iconUrl.split('/').pop()?.split('.')[0];
        if (iconName) {
          return `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}.jpg`;
        }
      }
      // For other full URLs, use as is
      return iconUrl;
    }
    
    return `https://wow.zamimg.com/images/wow/icons/large/${iconUrl}.jpg`;
  } catch (e) {
    console.error("Error processing icon URL:", e);
    // Fallback to default icon on error
    return "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
  }
}

// Function to shorten large numbers
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

// Function to get class icon URL
function getClassIconUrl(className: string): string {
  const classIcons: Record<string, string> = {
    "Death Knight": "spell_deathknight_classicon",
    "Demon Hunter": "inv_weapon_glave_01",
    "Druid": "inv_misc_monsterclaw_04",
    "Evoker": "classicon_evoker",
    "Hunter": "inv_weapon_bow_07",
    "Mage": "inv_staff_13",
    "Monk": "classicon_monk",
    "Paladin": "inv_hammer_01",
    "Priest": "inv_staff_30",
    "Rogue": "inv_throwingknife_04",
    "Shaman": "inv_jewelry_talisman_04",
    "Warlock": "spell_nature_faeriefire",
    "Warrior": "inv_sword_27"
  };
  
  const icon = classIcons[className] || "inv_misc_questionmark";
  return `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;
}

// Function to get spec icon
function getSpecIcon(className: string, specName: string): string {
  const specIcons: Record<string, Record<string, string>> = {
    "Death Knight": {
      "Blood": "spell_deathknight_bloodpresence",
      "Frost": "spell_frost_freezingbreath",
      "Unholy": "spell_deathknight_unholypresence"
    },
    "Demon Hunter": {
      "Havoc": "ability_demonhunter_specdps",
      "Vengeance": "ability_demonhunter_spectank"
    },
    "Druid": {
      "Balance": "spell_nature_starfall",
      "Feral": "ability_druid_catform",
      "Guardian": "ability_racial_bearform",
      "Restoration": "spell_nature_healingtouch"
    },
    "Evoker": {
      "Devastation": "classicon_evoker_devastation",
      "Preservation": "classicon_evoker_preservation",
      "Augmentation": "classicon_evoker_augmentation",
    },
    "Hunter": {
      "Beast Mastery": "ability_hunter_bestialdiscipline",
      "Marksmanship": "ability_hunter_focusedaim",
      "Survival": "ability_hunter_camouflage"
    },
    "Mage": {
      "Arcane": "spell_holy_magicalsentry",
      "Fire": "spell_fire_firebolt02",
      "Frost": "spell_frost_frostbolt02"
    },
    "Monk": {
      "Brewmaster": "spell_monk_brewmaster_spec",
      "Mistweaver": "spell_monk_mistweaver_spec",
      "Windwalker": "spell_monk_windwalker_spec"
    },
    "Paladin": {
      "Holy": "spell_holy_holybolt",
      "Protection": "ability_paladin_shieldofthetemplar",
      "Retribution": "spell_holy_auraoflight"
    },
    "Priest": {
      "Discipline": "spell_holy_powerwordshield",
      "Holy": "spell_holy_guardianspirit",
      "Shadow": "spell_shadow_shadowwordpain"
    },
    "Rogue": {
      "Assassination": "ability_rogue_deadlybrew",
      "Outlaw": "ability_rogue_pistolshot",
      "Subtlety": "ability_stealth"
    },
    "Shaman": {
      "Elemental": "spell_nature_lightning",
      "Enhancement": "spell_shaman_improvedstormstrike",
      "Restoration": "spell_nature_magicimmunity"
    },
    "Warlock": {
      "Affliction": "spell_shadow_deathcoil",
      "Demonology": "spell_shadow_metamorphosis",
      "Destruction": "spell_shadow_rainoffire"
    },
    "Warrior": {
      "Arms": "ability_warrior_savageblow",
      "Fury": "ability_warrior_innerrage",
      "Protection": "ability_warrior_defensivestance"
    }
  };

  const icon = specIcons[className]?.[specName] || "inv_misc_questionmark";
  return `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`;
}

// Function to get role icon
function getRoleIcon(role: string): string {
  const roleLower = role.toLowerCase();
  
  // Use the same URLs as in RosterItem for consistency
  if (roleLower === 'tank') return 'https://static.wikia.nocookie.net/wowwiki/images/7/7e/Icon-class-role-tank-42x42.png';
  if (roleLower === 'dps') return 'https://static.wikia.nocookie.net/wowwiki/images/3/3f/Icon-class-role-dealer-42x42.png';
  if (roleLower === 'healer' || roleLower === 'healing') return 'https://static.wikia.nocookie.net/wowwiki/images/0/07/Icon-class-role-healer-42x42.png';
  
  // Fallback
  return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
}

// Types for API responses
interface BossResponse {
  bosses: RaidBoss[];
  apiStatus: string;
  lastUpdated: string;
}

interface BossUpdateResponse {
  boss: RaidBoss;
  message: string;
}

interface GuildMemberResponse {
  characters: Character[];
  apiStatus: string;
  lastUpdated: string;
  totalMembers: number;
}

interface AdminUser {
  id: number;
  username: string;
  isOwner: boolean;
  created_at: string;
}

interface AdminUserResponse {
  users: AdminUser[];
  apiStatus: string;
  totalUsers: number;
}

interface GuildSummary {
  totalMembers: number;
  classDistribution: { className: string; count: number }[];
  roleDistribution: { role: string; count: number }[];
  raidProgress: { raidName: string; bossesDefeated: number; totalBosses: number }[];
  averageItemLevel: number;
  memberActivity: { date: string; count: number }[];
}

// Application Response types
interface ApplicationsResponse {
  applications: Application[];
  apiStatus: string;
  totalApplications: number;
}

interface ApplicationCommentsResponse {
  comments: ApplicationComment[];
  apiStatus: string;
}

interface Expansion {
  id: number;
  name: string;
  shortName: string;
  isActive: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

interface RaidTier {
  id: number;
  name: string;
  shortName: string;
  expansionId: number;
  isActive: boolean;
  isCurrent: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

interface ExpansionsResponse {
  expansions: Expansion[];
  apiStatus: string;
}

interface RaidTiersResponse {
  tiers: RaidTier[];
  apiStatus: string;
}

// Website settings management functionality
function useWebsiteSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const updateSetting = async (key: string, value: string) => {
    try {
      const response = await apiRequest('PUT', `/api/admin/settings/${key}`, { value });
      const data = await response.json();
      
      if (data.setting) {
        queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
        return { success: true, setting: data.setting };
      } else {
        return { success: false, error: data.message || 'Failed to update setting' };
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      return { success: false, error: 'An error occurred while updating the setting' };
    }
  };
  
  // Get all website settings by category
  const getSettingsByCategory = async (category: string) => {
    try {
      const response = await apiRequest('GET', `/api/settings?category=${category}`);
      const data = await response.json();
      
      if (data.settings) {
        return { success: true, settings: data.settings };
      } else {
        return { success: false, error: data.message || 'Failed to fetch settings' };
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      return { success: false, error: 'An error occurred while fetching settings' };
    }
  };

  // Handle setting update with dialog
  const handleSettingUpdate = async (key: string, value: string, description: string) => {
    const result = await updateSetting(key, value);
    
    if (result.success) {
      toast({
        title: "Setting Updated",
        description: description || "Setting updated successfully",
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.error,
        variant: "destructive",
      });
    }
  };
  
  return { updateSetting, getSettingsByCategory, handleSettingUpdate };
}

// Main dashboard component
export default function AdminDashboard() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [selectedRaid, setSelectedRaid] = useState<string>("Liberation of Undermine");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("mythic");
  const [selectedRaidTierId, setSelectedRaidTierId] = useState<number | null>(null);
  const [logsTabActive, setLogsTabActive] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState('all');
  const [applicationSearchQuery, setApplicationSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [commentText, setCommentText] = useState('');
  const [selectedExpansionId, setSelectedExpansionId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  const { handleSettingUpdate } = useWebsiteSettings();

  // Authentication check
  const { data: authData, isLoading: isAuthLoading } = useQuery({
    queryKey: ['/api/admin/status'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/status');
      return await response.json();
    }
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !authData?.loggedIn) {
      navigate('/admin-login');
    }
  }, [isAuthLoading, authData, navigate]);

  // Fetch raid tier data
  const {
    data: raidTiersData,
    isLoading: isLoadingRaidTiers,
    refetch: refetchRaidTiers
  } = useQuery({
    queryKey: ['/api/raid-tiers'],
    enabled: !!authData?.loggedIn && (activeSection === 'raid-progress' || activeSection === 'raid-tiers')
  });
  
  // Initialize the tier ID from raid tiers on first load
  useEffect(() => {
    if (raidTiersData?.tiers && raidTiersData.tiers.length > 0 && selectedRaidTierId === null) {
      // Find the current tier first
      const currentTier = raidTiersData.tiers.find(tier => tier.isCurrent);
      if (currentTier) {
        setSelectedRaidTierId(currentTier.id);
      } else {
        // If no current tier found, use the first tier
        setSelectedRaidTierId(raidTiersData.tiers[0].id);
      }
    }
  }, [raidTiersData, selectedRaidTierId]);

  // Fetch raid bosses by tier ID
  const { 
    data: bossesData, 
    isLoading: isLoadingBosses, 
    refetch: refetchBosses 
  } = useQuery<BossResponse>({
    queryKey: ['/api/raid-bosses/by-tier', selectedRaidTierId, selectedDifficulty],
    queryFn: async () => {
      if (!selectedRaidTierId) return { bosses: [], apiStatus: 'loading', lastUpdated: new Date().toISOString() };
      
      const response = await apiRequest(
        'GET', 
        `/api/raid-bosses/by-tier/${selectedRaidTierId}?difficulty=${selectedDifficulty}`
      );
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'raid-progress' && selectedRaidTierId !== null
  });

  // Fetch guild members for admin
  const {
    data: guildMembersData,
    isLoading: isLoadingMembers,
    refetch: refetchMembers
  } = useQuery<GuildMemberResponse>({
    queryKey: ['/api/admin/guild-members'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/guild-members');
      return response.json();
    },
    enabled: !!authData?.loggedIn && (activeSection === 'members' || activeSection === 'overview')
  });

  // Fetch admin users
  const {
    data: adminUsersData,
    isLoading: isLoadingAdminUsers,
    refetch: refetchAdminUsers
  } = useQuery<AdminUserResponse>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/users');
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'settings'
  });
  

  
  // Fetch system logs for logs panel
  const {
    data: logsData,
    isLoading: isLoadingLogs,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ['/api/admin/logs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/logs');
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'logs'
  });
  
  // Fetch expansions for raid tier management
  const {
    data: expansionsData,
    isLoading: isLoadingExpansions,
    refetch: refetchExpansions
  } = useQuery({
    queryKey: ['/api/admin/expansions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/expansions');
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'raid-tiers'
  });

  // Fetch raid tiers for raid tier management
  const {
    data: adminRaidTiersData,
    isLoading: isLoadingAdminRaidTiers,
    refetch: refetchAdminRaidTiers
  } = useQuery({
    queryKey: ['/api/admin/raid-tiers', selectedExpansionId],
    queryFn: async () => {
      let url = '/api/admin/raid-tiers';
      if (selectedExpansionId) {
        url += `?expansionId=${selectedExpansionId}`;
      }
      const response = await apiRequest('GET', url);
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'raid-tiers',
    // If we get no data from this query, force a refetch once when expansion ID is selected
    refetchOnMount: true
  });
  
  // Website Content data for content management tab
  const {
    data: websiteContentData,
    isLoading: isLoadingWebsiteContent,
    refetch: refetchWebsiteContent
  } = useQuery({
    queryKey: ['/api/admin/content'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/content');
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'content'
  });
  
  // Translations data for content management tab
  const {
    data: translationsData,
    isLoading: isLoadingTranslations,
    refetch: refetchTranslations
  } = useQuery({
    queryKey: ['/api/admin/translations'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/translations');
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'content'
  });
  
  // Media Library data for content management tab
  const {
    data: mediaFilesData,
    isLoading: isLoadingMediaFiles,
    refetch: refetchMediaFiles
  } = useQuery({
    queryKey: ['/api/admin/media'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/media');
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'content'
  });
  
  // Fetch applications with status and search filters
  const {
    data: applicationsData,
    isLoading: isLoadingApplications,
    refetch: refetchApplications
  } = useQuery<ApplicationsResponse>({
    queryKey: ['/api/applications', applicationStatusFilter, applicationSearchQuery],
    queryFn: async () => {
      let url = '/api/applications';
      const params = new URLSearchParams();
      
      if (applicationStatusFilter !== 'all') {
        params.append('status', applicationStatusFilter);
      }
      
      if (applicationSearchQuery.trim()) {
        params.append('search', applicationSearchQuery.trim());
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await apiRequest('GET', url);
      return response.json();
    },
    enabled: !!authData?.loggedIn && activeSection === 'applications'
  });
  
  // Fetch comments for a selected application
  const {
    data: applicationCommentsData,
    isLoading: isLoadingApplicationComments,
    refetch: refetchApplicationComments
  } = useQuery<ApplicationCommentsResponse>({
    queryKey: ['/api/applications', selectedApplication?.id, 'comments'],
    queryFn: async () => {
      if (!selectedApplication) return { comments: [], apiStatus: 'success' };
      
      const response = await apiRequest('GET', `/api/applications/${selectedApplication.id}/comments`);
      return response.json();
    },
    enabled: !!authData?.loggedIn && !!selectedApplication
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

  // Mutation to update individual character score
  const updateCharacterScoreMutation = useMutation({
    mutationFn: async (characterId: number) => {
      const response = await apiRequest('POST', `/api/characters/${characterId}/update-scores`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Updated ${data.character.name}'s score to ${data.character.raiderIoScore}`,
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guild-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roster'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update character score: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update all character scores in the guild
  const updateAllCharacterScoresMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/update-character-scores', {
        guildName: "Guttakrutt",
        realm: "Tarren Mill",
        region: "eu"
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: `Updated scores for ${data.results.updatedCharacters} characters`,
        duration: 5000,
      });
      
      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guild-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roster'] });
      
      // Also refetch the members to update the UI
      refetchMembers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update character scores: ${error.message}`,
        variant: "destructive",
        duration: 5000,
      });
    },
  });
  
  // Mutation to refresh guild members
  const refreshGuildMembersMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/refresh-guild-members');
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the cache for guild members and related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guild-members'] });
      queryClient.invalidateQueries({ queryKey: ['/api/roster'] });
      
      // Show a detailed success toast with the refresh statistics
      toast({
        title: "Success",
        description: data.message || "Guild members refreshed successfully",
      });
      
      // Show detailed stats if available
      if (data.stats) {
        toast({
          title: "Refresh Summary",
          description: `Updated: ${data.stats.updated}, New: ${data.stats.new}, Removed: ${data.stats.removed}, Rank Changes: ${data.stats.rankChanges}`,
          variant: "default",
        });
      }
      
      // Refetch the members to update the UI
      refetchMembers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to refresh guild members: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete admin user
  const deleteAdminUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Admin user deleted successfully",
      });
      refetchAdminUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete admin user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to create admin user
  const createAdminUserMutation = useMutation({
    mutationFn: async (userData: { username: string; password: string }) => {
      const response = await apiRequest('POST', '/api/admin/create', userData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Admin user created successfully",
      });
      refetchAdminUsers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create admin user: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to change admin password
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest('POST', '/api/admin/change-password', passwordData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Password changed successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to change password: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to create a new expansion
  const createExpansionMutation = useMutation({
    mutationFn: async (expansionData: Partial<Expansion>) => {
      const response = await apiRequest('POST', '/api/admin/expansions', expansionData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Expansion created successfully",
      });
      refetchExpansions();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create expansion: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update an expansion
  const updateExpansionMutation = useMutation({
    mutationFn: async ({ id, expansionData }: { id: number, expansionData: Partial<Expansion> }) => {
      const response = await apiRequest('PATCH', `/api/admin/expansions/${id}`, expansionData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Expansion updated successfully",
      });
      refetchExpansions();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update expansion: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to create a new raid tier
  const createRaidTierMutation = useMutation({
    mutationFn: async (tierData: Partial<RaidTier>) => {
      const response = await apiRequest('POST', '/api/admin/raid-tiers', tierData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Raid tier created successfully",
      });
      refetchRaidTiers();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create raid tier: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to update a raid tier
  const updateRaidTierMutation = useMutation({
    mutationFn: async ({ id, tierData }: { id: number, tierData: Partial<RaidTier> }) => {
      const response = await apiRequest('PATCH', `/api/admin/raid-tiers/${id}`, tierData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Raid tier updated successfully",
      });
      refetchRaidTiers();
      
      // If we updated current tier status, refresh the progress data too
      if (data.tier?.isCurrent) {
        queryClient.invalidateQueries({ queryKey: ['/api/raid-progress'] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update raid tier: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to change application status
  const changeApplicationStatusMutation = useMutation({
    mutationFn: async ({ applicationId, status, reviewNote }: { applicationId: number; status: string; reviewNote: string }) => {
      const response = await apiRequest('PATCH', `/api/applications/${applicationId}/status`, { status, reviewNotes: reviewNote });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Application status changed successfully",
      });
      
      // Invalidate applications queries with all possible status filters
      queryClient.invalidateQueries({ 
        queryKey: ['/api/applications'] 
      });
      
      // Refresh the pending application count in the overview
      queryClient.invalidateQueries({ 
        queryKey: ['/api/applications', 'pending'] 
      });
      
      setSelectedApplication(null);
      setReviewNote('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to change application status: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to add comment to application
  const addApplicationCommentMutation = useMutation({
    mutationFn: async ({ applicationId, comment }: { applicationId: number; comment: string }) => {
      const response = await apiRequest('POST', `/api/applications/${applicationId}/comments`, { comment });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Comment added successfully",
      });
      refetchApplicationComments();
      setCommentText('');
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add comment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Get bosses from data
  const bosses = bossesData?.bosses || [];
  const characters = guildMembersData?.characters || [];
  const adminUsers = adminUsersData?.users || [];

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
      // Make sure to invalidate all admin-related queries
      queryClient.invalidateQueries({ queryKey: ['/api/admin/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/guild-members'] });
      
      // Clear any cached admin data
      queryClient.removeQueries({ queryKey: ['/api/admin'] });
      
      // Use window.location for a hard redirect to ensure fresh state
      window.location.href = '/admin-login';
    } catch (error) {
      console.error("Logout failed", error);
      toast({
        title: "Logout Failed",
        description: "There was an error during logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate summary data for guild stats
  const calculateGuildSummary = (): GuildSummary => {
    // Default empty summary
    const emptySummary: GuildSummary = {
      totalMembers: 0,
      classDistribution: [],
      roleDistribution: [],
      raidProgress: [
        { raidName: "Liberation of Undermine", bossesDefeated: 0, totalBosses: 8 },
        { raidName: "Nerub-ar Palace", bossesDefeated: 0, totalBosses: 8 }
      ],
      averageItemLevel: 0,
      memberActivity: Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return { date: format(date, 'MMM dd'), count: 0 };
      }).reverse()
    };
    
    if (!characters || characters.length === 0) {
      return emptySummary;
    }
    
    // Class distribution
    const classCount: Record<string, number> = {};
    characters.forEach(char => {
      classCount[char.className] = (classCount[char.className] || 0) + 1;
    });
    
    const classDistribution = Object.entries(classCount)
      .map(([className, count]) => ({ className, count }))
      .sort((a, b) => b.count - a.count);
    
    // Role distribution - improved to handle specializations
    const roleCount: Record<string, number> = { tank: 0, healer: 0, dps: 0 };
    characters.forEach(char => {
      // First try to use the explicit role if available
      if (char.role) {
        const role = char.role.toLowerCase();
        if (role === 'tank' || role === 'healer' || role === 'dps') {
          roleCount[role] += 1;
          return;
        }
      }
      
      // If no role is available or invalid, use specialization to determine role
      const spec = (char.specName || '').toLowerCase();
      if (
        spec.includes('protection') || 
        spec.includes('guardian') || 
        spec.includes('brewmaster') || 
        spec.includes('blood') || 
        spec.includes('vengeance')
      ) {
        roleCount['tank'] += 1;
      } else if (
        spec.includes('restoration') || 
        spec.includes('holy') || 
        spec.includes('discipline') || 
        spec.includes('mistweaver') || 
        spec.includes('preservation')
      ) {
        roleCount['healer'] += 1;
      } else {
        // Default to DPS if no role info available or no tank/healer specs
        roleCount['dps'] += 1;
      }
    });
    
    // Sort roles in standard order: tank, healer, dps
    const orderedRoles = ['tank', 'healer', 'dps'];
    const roleDistribution = orderedRoles
      .map(role => ({ role, count: roleCount[role] || 0 }));
    
    // Average item level
    const totalItemLevel = characters.reduce((sum, char) => sum + (char.itemLevel || 0), 0);
    const averageItemLevel = characters.length > 0 ? Math.round(totalItemLevel / characters.length) : 0;
    
    // Member activity (simulate with random data for now)
    const memberActivity = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      // Generate random count between 60-90% of total members to simulate active members
      const activityPercent = 0.6 + Math.random() * 0.3;
      return { 
        date: format(date, 'MMM dd'), 
        count: Math.floor(characters.length * activityPercent)
      };
    }).reverse();
    
    // Get raid progress data from bosses
    // This would typically come from a separate API call, using placeholder data for now
    const raidProgress = [
      { raidName: "Liberation of Undermine", bossesDefeated: 4, totalBosses: 8 },
      { raidName: "Nerub-ar Palace", bossesDefeated: 7, totalBosses: 8 }
    ];
    
    return {
      totalMembers: characters.length,
      classDistribution,
      roleDistribution,
      raidProgress,
      averageItemLevel,
      memberActivity
    };
  };

  // Calculate guild summary
  const guildSummary = calculateGuildSummary();

  // Filter characters based on search query and class filter
  const filteredCharacters = characters.filter(char => {
    // Search query filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = 
        char.name.toLowerCase().includes(lowerQuery) || 
        char.className.toLowerCase().includes(lowerQuery) || 
        (char.specName && char.specName.toLowerCase().includes(lowerQuery)) || 
        (char.realm && char.realm.toLowerCase().includes(lowerQuery));
      
      if (!matchesSearch) return false;
    }
    
    // Class filter
    if (classFilter !== 'all') {
      const normalizedClassName = char.className.toLowerCase().replace(/\s+/g, '-');
      return normalizedClassName === classFilter;
    }
    
    return true;
  });
  
  // Sort by rank (0-9)
  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    // Handle special rank 99 (former members) to be sorted last
    if (a.rank === 99) return 1;
    if (b.rank === 99) return -1;
    
    // Sort by rank (ascending, 0 is GM)
    return a.rank - b.rank;
  });

  // If loading authentication status
  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin shadow-xl"></div>
      </div>
    );
  }

  // If not authenticated, redirect is handled in useEffect

  return (
    <div className="flex h-screen bg-gradient-to-br from-black to-gray-900 text-wow-light overflow-hidden">
      {/* Sidebar */}
      <div 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black/70 border-r border-wow-gold/20 transition-all duration-300 ease-in-out backdrop-blur-sm flex flex-col h-full`}
      >
        <div className="p-4 border-b border-wow-gold/20 flex items-center justify-between">
          <div className={`flex items-center ${!isSidebarOpen && 'justify-center w-full'}`}>
            <GuildLogo size={isSidebarOpen ? "md" : "sm"} />
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`text-wow-light hover:text-wow-gold transition-colors ${!isSidebarOpen && 'hidden'}`}
          >
            {isSidebarOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'overview' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <Home className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Overview</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('members')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'members' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <Users className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Guild Members</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('raid-progress')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'raid-progress' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <Award className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Raid Progress</span>}
            </button>

            <button
              onClick={() => setActiveSection('raid-tiers')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'raid-tiers' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <BookOpen className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Raid Tiers</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('applications')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'applications' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <UserPlus className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Applications</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('analytics')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'analytics' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <AreaChart className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Analytics</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('content')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'content' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <FileText className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Content</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('logs')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'logs' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <Activity className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>System Logs</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('error-testing')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'error-testing' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <AlertTriangle className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Error Testing</span>}
            </button>
            
            <button
              onClick={() => setActiveSection('settings')}
              className={`flex items-center w-full px-3 py-2 rounded-lg transition-colors ${
                activeSection === 'settings' 
                  ? 'bg-wow-gold/20 text-wow-gold' 
                  : 'text-wow-light hover:bg-wow-gold/10 hover:text-wow-gold'
              } ${!isSidebarOpen && 'justify-center'}`}
            >
              <Settings className={`${isSidebarOpen ? 'mr-3' : ''} h-5 w-5`} />
              {isSidebarOpen && <span>Settings</span>}
            </button>
          </nav>
        </div>
        
        <div className="p-4 border-t border-wow-gold/20">
          {isSidebarOpen ? (
            <Button 
              variant="ghost" 
              className="w-full justify-start text-wow-light hover:bg-red-900/20 hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </Button>
          ) : (
            <Button 
              variant="ghost" 
              className="w-full justify-center text-wow-light hover:bg-red-900/20 hover:text-red-400"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        {/* Header */}
        <header className="bg-black/60 backdrop-blur-sm border-b border-wow-gold/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                className="block md:hidden text-wow-light hover:text-wow-gold transition-colors"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-wow text-wow-gold">
                {activeSection === 'overview' && 'Dashboard Overview'}
                {activeSection === 'members' && 'Guild Members'}
                {activeSection === 'raid-progress' && 'Raid Progress'}
                {activeSection === 'raid-tiers' && 'Raid Tier Management'}
                {activeSection === 'applications' && 'Applications Management'}
                {activeSection === 'analytics' && 'Guild Analytics'}
                {activeSection === 'content' && 'Content Management'}
                {activeSection === 'logs' && 'System Logs'}
                {activeSection === 'error-testing' && 'Error Testing Tool'}
                {activeSection === 'settings' && 'Admin Settings'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="h-5 w-5 text-wow-light cursor-pointer hover:text-wow-gold transition-colors" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-2 cursor-pointer">
                    <Avatar className="border border-wow-gold/30">
                      <AvatarImage src="/assets/admin-avatar.jpg" />
                      <AvatarFallback className="bg-green-900 text-wow-gold">
                        {authData?.admin?.username?.charAt(0).toUpperCase() || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block">
                      <p className="text-sm font-medium text-wow-gold">{authData?.admin?.username || 'Admin'}</p>
                      <p className="text-xs text-wow-light">Administrator</p>
                    </div>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-1 bg-black/95 border border-wow-gold/20 text-wow-light">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-wow-gold/20" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                        onSelect={(e) => {
                          // Prevent the dropdown from closing when clicking this item
                          e.preventDefault();
                        }}
                      >
                        <Settings className="mr-2 h-4 w-4" /> 
                        <span>Account Settings</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-wow-gold text-xl">Account Settings</DialogTitle>
                        <DialogDescription className="text-wow-light">
                          Manage your account preferences
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-1">
                          <Label className="text-wow-gold">Username</Label>
                          <Input 
                            value={authData?.admin?.username || ''}
                            disabled
                            className="bg-black/50 border-wow-gold/30 text-wow-light"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-wow-gold">Role</Label>
                          <Input 
                            value={authData?.admin?.isOwner ? 'Owner' : 'Administrator'}
                            disabled
                            className="bg-black/50 border-wow-gold/30 text-wow-light"
                          />
                        </div>
                        <Separator className="bg-wow-gold/20" />
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-wow-gold">Dark Mode</Label>
                            <p className="text-sm text-wow-light">Always enabled for better visibility</p>
                          </div>
                          <Switch checked disabled />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50">
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <DropdownMenuSeparator className="bg-wow-gold/20" />
                  <Dialog>
                    <DialogTrigger asChild>
                      <DropdownMenuItem 
                        className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                        onSelect={(e) => {
                          // Prevent the dropdown from closing when clicking this item
                          e.preventDefault();
                        }}
                      >
                        <Lock className="mr-2 h-4 w-4" /> 
                        <span>Change Password</span>
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-wow-gold text-xl">Change Password</DialogTitle>
                        <DialogDescription className="text-wow-light">
                          Enter your current password and your new password.
                        </DialogDescription>
                      </DialogHeader>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const currentPassword = formData.get('currentPassword') as string;
                          const newPassword = formData.get('newPassword') as string;
                          
                          if (newPassword.length < 8) {
                            toast({
                              title: "Error",
                              description: "New password must be at least 8 characters long",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          changePasswordMutation.mutate({ currentPassword, newPassword });
                        }}
                      >
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword" className="text-wow-gold">Current Password</Label>
                            <Input
                              id="currentPassword"
                              name="currentPassword"
                              type="password"
                              placeholder="Enter your current password"
                              required
                              className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-wow-gold">New Password</Label>
                            <Input
                              id="newPassword"
                              name="newPassword"
                              type="password"
                              placeholder="Enter your new password"
                              required
                              className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-wow-gold">Confirm New Password</Label>
                            <Input
                              id="confirmPassword"
                              name="confirmPassword"
                              type="password"
                              placeholder="Confirm your new password"
                              required
                              className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50 shadow-md"
                            disabled={changePasswordMutation.isPending}
                          >
                            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                  <DropdownMenuItem
                    className="cursor-pointer hover:bg-red-900/20 hover:text-red-400"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> 
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Content area */}
        <main className="h-[calc(100vh-73px)] overflow-y-auto p-6 bg-black/20">
          {/* Dashboard Overview */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Stats overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-green-900/30 to-green-800/10">
                    <CardTitle className="text-wow-gold text-lg flex items-center">
                      <Users className="h-5 w-5 mr-2 text-green-400" />
                      Guild Members
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        {isLoadingMembers ? 
                          <Skeleton className="h-8 w-16 bg-green-900/30" /> : 
                          <p className="text-3xl font-bold text-wow-gold">
                            {guildSummary.totalMembers}
                          </p>
                        }
                        <p className="text-sm text-wow-light">Total members</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-green-900/30 text-green-400 border-green-500/30">
                          Active
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-amber-900/30 to-amber-800/10">
                    <CardTitle className="text-wow-gold text-lg flex items-center">
                      <Award className="h-5 w-5 mr-2 text-amber-400" />
                      Mythic Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        {isLoadingBosses ? 
                          <Skeleton className="h-8 w-16 bg-amber-900/30" /> : 
                          <p className="text-3xl font-bold text-wow-gold">
                            4/8
                          </p>
                        }
                        <p className="text-sm text-wow-light">Liberation of Undermine</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-amber-900/30 text-amber-400 border-amber-500/30">
                          In Progress
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-blue-900/30 to-blue-800/10">
                    <CardTitle className="text-wow-gold text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-400" />
                      Average Item Level
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        {isLoadingMembers ? 
                          <Skeleton className="h-8 w-16 bg-blue-900/30" /> : 
                          <p className="text-3xl font-bold text-wow-gold">
                            {guildSummary.averageItemLevel}
                          </p>
                        }
                        <p className="text-sm text-wow-light">Avg. equipped iLvl</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-blue-900/30 text-blue-400 border-blue-500/30">
                          Good
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden">
                  <CardHeader className="pb-2 bg-gradient-to-r from-purple-900/30 to-purple-800/10">
                    <CardTitle className="text-wow-gold text-lg flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-purple-400" />
                      Applications
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-3xl font-bold text-wow-gold">
                          {isLoadingApplications ? (
                            <Skeleton className="h-8 w-16 bg-amber-900/30" />
                          ) : (
                            applicationsData?.applications.filter(app => app.status === "pending").length || 0
                          )}
                        </p>
                        <p className="text-sm text-wow-light">Pending review</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="bg-purple-900/30 text-purple-400 border-purple-500/30">
                          Review
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Activity and Class Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Class distribution */}
                <div className="lg:col-span-1">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-wow-gold">Class Distribution</CardTitle>
                      <CardDescription className="text-wow-light">Guild class composition</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMembers ? (
                        <div className="space-y-3">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-8 w-full bg-green-900/20" />
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {guildSummary.classDistribution.map(({ className, count }) => (
                            <div key={className} className="space-y-1">
                              <div className="flex justify-between">
                                <p className={`text-sm font-medium ${getClassColor(className)}`}>{className}</p>
                                <p className="text-sm text-wow-light">{count} ({Math.round(count / guildSummary.totalMembers * 100)}%)</p>
                              </div>
                              <Progress 
                                value={count / guildSummary.totalMembers * 100} 
                                className={`h-2 bg-black/50 ${getClassBgColor(className)}`}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Activity chart */}
                <div className="lg:col-span-2">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-wow-gold">Guild Activity</CardTitle>
                      <CardDescription className="text-wow-light">Active members over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMembers ? (
                        <div className="h-56 w-full flex items-center justify-center">
                          <Skeleton className="h-40 w-full bg-green-900/20" />
                        </div>
                      ) : (
                        <div className="h-56 w-full">
                          <div className="flex h-48 items-end space-x-2">
                            {guildSummary.memberActivity.map((data) => {
                              const height = Math.max((data.count / guildSummary.totalMembers) * 100, 5);
                              return (
                                <div key={data.date} className="flex-1 flex flex-col items-center">
                                  <div 
                                    className="w-full bg-gradient-to-t from-green-900/60 to-green-700/40 rounded-t-sm"
                                    style={{ height: `${height}%` }}
                                  ></div>
                                  <p className="text-xs text-wow-light mt-2">{data.date}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Raid Progress and Role Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Raid progress */}
                <div className="lg:col-span-2">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-wow-gold">Raid Progress</CardTitle>
                      <CardDescription className="text-wow-light">Current tier raid progression</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {guildSummary.raidProgress.map((raid) => (
                          <div key={raid.raidName} className="space-y-2">
                            <div className="flex justify-between">
                              <p className="text-wow-gold font-medium">{raid.raidName}</p>
                              <p className="text-wow-light">{raid.bossesDefeated}/{raid.totalBosses} Mythic</p>
                            </div>
                            <Progress 
                              value={raid.bossesDefeated / raid.totalBosses * 100} 
                              className={`h-3 bg-black/50 ${raid.raidName.includes("Undermine") ? "bg-green-700/60" : "bg-amber-700/60"}`}
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Role distribution */}
                <div className="lg:col-span-1">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-wow-gold">Role Distribution</CardTitle>
                      <CardDescription className="text-wow-light">Guild roles overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMembers ? (
                        <div className="h-40 w-full flex items-center justify-center">
                          <Skeleton className="h-40 w-40 rounded-full bg-green-900/20" />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="relative w-40 h-40">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-xl font-bold text-wow-gold">{guildSummary.totalMembers}</p>
                                <p className="text-xs text-wow-light">Members</p>
                              </div>
                            </div>
                            <svg width="160" height="160" viewBox="0 0 160 160">
                              {/* DPS segment - typically largest */}
                              <circle
                                cx="80"
                                cy="80"
                                r="60"
                                fill="transparent"
                                stroke="#ef4444"
                                strokeWidth="20"
                                strokeDasharray="376.8"
                                strokeDashoffset="0"
                              />
                              
                              {/* Healers segment */}
                              <circle
                                cx="80"
                                cy="80"
                                r="60"
                                fill="transparent"
                                stroke="#22c55e"
                                strokeWidth="20"
                                strokeDasharray="376.8"
                                strokeDashoffset={376.8 * 0.7} // 30% of circle
                              />
                              
                              {/* Tanks segment - typically smallest */}
                              <circle
                                cx="80"
                                cy="80"
                                r="60"
                                fill="transparent"
                                stroke="#3b82f6"
                                strokeWidth="20"
                                strokeDasharray="376.8"
                                strokeDashoffset={376.8 * 0.9} // 10% of circle
                              />
                            </svg>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 w-full mt-4">
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                <span className="text-sm text-wow-light">Tanks</span>
                              </div>
                              <p className="text-wow-gold font-bold">10%</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                <span className="text-sm text-wow-light">Healers</span>
                              </div>
                              <p className="text-wow-gold font-bold">20%</p>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="flex items-center">
                                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                <span className="text-sm text-wow-light">DPS</span>
                              </div>
                              <p className="text-wow-gold font-bold">70%</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Recent activity feed */}
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-wow-gold">Recent Activity</CardTitle>
                  <CardDescription className="text-wow-light">Latest guild events and changes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="bg-green-900/30 rounded-full p-2">
                        <UserPlus className="h-4 w-4 text-green-400" />
                      </div>
                      <div>
                        <p className="text-wow-light font-medium">New member joined</p>
                        <p className="text-sm text-wow-light">
                          <span className="text-green-400">Healzforyou</span> joined the guild as a <span className="text-white">Restoration Druid</span>
                        </p>
                        <p className="text-xs text-wow-light mt-1">2 hours ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-amber-900/30 rounded-full p-2">
                        <Award className="h-4 w-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-wow-light font-medium">Boss defeated</p>
                        <p className="text-sm text-wow-light">
                          Guild has defeated <span className="text-amber-400">Tindral Sageswift, Seer of the Flame</span> on Mythic difficulty
                        </p>
                        <p className="text-xs text-wow-light mt-1">1 day ago</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-4">
                      <div className="bg-blue-900/30 rounded-full p-2">
                        <Shield className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-wow-light font-medium">Rank change</p>
                        <p className="text-sm text-wow-light">
                          <span className="text-blue-400">Stabsteroni</span> was promoted to <span className="text-white">Officer</span>
                        </p>
                        <p className="text-xs text-wow-light mt-1">3 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Guild Members Section */}
          {activeSection === 'members' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 md:min-w-[300px]">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-wow-light" />
                    <Input 
                      placeholder="Search members..." 
                      className="pl-10 bg-black/50 border-wow-gold/20 text-wow-light placeholder:text-wow-light focus:border-wow-gold/40"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select
                    value={classFilter}
                    onValueChange={setClassFilter}
                    defaultValue="all"
                  >
                    <SelectTrigger className="bg-black/50 border-wow-gold/20 text-wow-light w-[180px]">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-wow-gold/20 text-wow-light">
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="death-knight">Death Knight</SelectItem>
                      <SelectItem value="demon-hunter">Demon Hunter</SelectItem>
                      <SelectItem value="druid">Druid</SelectItem>
                      <SelectItem value="evoker">Evoker</SelectItem>
                      <SelectItem value="hunter">Hunter</SelectItem>
                      <SelectItem value="mage">Mage</SelectItem>
                      <SelectItem value="monk">Monk</SelectItem>
                      <SelectItem value="paladin">Paladin</SelectItem>
                      <SelectItem value="priest">Priest</SelectItem>
                      <SelectItem value="rogue">Rogue</SelectItem>
                      <SelectItem value="shaman">Shaman</SelectItem>
                      <SelectItem value="warlock">Warlock</SelectItem>
                      <SelectItem value="warrior">Warrior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold hover:border-wow-gold/30"
                    onClick={() => refreshGuildMembersMutation.mutate()}
                    disabled={refreshGuildMembersMutation.isPending}
                  >
                    {refreshGuildMembersMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Members
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="bg-black/50 border-purple-500/40 text-wow-light hover:bg-purple-900/30 hover:text-purple-300 hover:border-purple-500/60"
                    onClick={() => updateAllCharacterScoresMutation.mutate()}
                    disabled={updateAllCharacterScoresMutation.isPending}
                  >
                    {updateAllCharacterScoresMutation.isPending ? (
                      <>
                        <Star className="h-4 w-4 mr-2 animate-pulse" />
                        Updating Scores...
                      </>
                    ) : (
                      <>
                        <Star className="h-4 w-4 mr-2" />
                        Update All Scores
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardContent className="p-0">
                  {isLoadingMembers ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full bg-green-900/10" />
                      ))}
                    </div>
                  ) : filteredCharacters.length === 0 ? (
                    <div className="py-12 text-center">
                      <Users className="h-10 w-10 mx-auto text-wow-light mb-3" />
                      <p className="text-wow-light">No members found matching your search criteria.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader className="bg-black/70">
                          <TableRow className="hover:bg-transparent border-b border-wow-gold/20">
                            <TableHead className="text-wow-gold font-semibold">Name</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Class & Spec</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Role</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Rank</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Level</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Item Level</TableHead>
                            <TableHead className="text-wow-gold font-semibold">RIO Score</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Last Online</TableHead>
                            <TableHead className="text-wow-gold font-semibold w-[120px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sortedCharacters.map((character) => (
                            <TableRow 
                              key={character.id}
                              className={`hover:bg-green-900/10 border-b border-wow-gold/10 ${getClassBgColor(character.className)}`}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                  {character.rank <= 1 && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <Crown className="h-4 w-4 text-amber-400" />
                                        </TooltipTrigger>
                                        <TooltipContent className="bg-black/90 border-wow-gold/20 text-wow-light">
                                          <p>Guild Master</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                  <a 
                                    href={character.armoryUrl || "#"} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={`${getClassColor(character.className)} hover:underline`}
                                  >
                                    {character.name}
                                  </a>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="flex space-x-2">
                                    <img 
                                      src={getClassIconUrl(character.className)} 
                                      alt={character.className} 
                                      className="w-8 h-8 rounded border border-wow-gold/20"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                                      }}
                                    />
                                  </div>
                                  <div className="ml-3">
                                    <p className={`${getClassColor(character.className)}`}>
                                      {character.className}
                                    </p>
                                    <p className="text-xs text-wow-light">
                                      {character.specName || '-'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <img 
                                    src={getRoleIcon(character.role || 'dps')} 
                                    alt={character.role || 'DPS'} 
                                    className="w-8 h-8 mr-2 rounded border border-wow-gold/20" 
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                                    }}
                                  />
                                  <span className="text-wow-light capitalize">
                                    {character.role || 'DPS'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant="outline" 
                                  className={`
                                    ${character.rank === 0 ? 'bg-amber-950/50 border-amber-500/50 text-amber-300' : 
                                      character.rank === 1 ? 'bg-purple-950/50 border-purple-500/50 text-purple-300' : 
                                      character.rank === 2 ? 'bg-blue-950/50 border-blue-500/50 text-blue-300' : 
                                      character.rank === 3 ? 'bg-blue-950/30 border-blue-500/30 text-blue-300/80' : 
                                      character.rank === 4 ? 'bg-green-950/50 border-green-500/50 text-green-300' : 
                                      character.rank === 5 ? 'bg-green-950/40 border-green-500/40 text-green-300/90' : 
                                      character.rank === 6 ? 'bg-purple-950/40 border-purple-500/40 text-purple-300/90' : 
                                      character.rank === 7 ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300/80' : 
                                      character.rank === 8 ? 'bg-green-950/30 border-green-500/30 text-green-300/80' : 
                                      character.rank === 9 ? 'bg-black/30 border-wow-gold/20 text-wow-light' : 
                                      'bg-black/30 border-wow-gold/20 text-wow-light'}
                                  `}
                                >
                                  {character.rank === 0 ? 'Guild Master' : 
                                   character.rank === 1 ? 'Raid Leader' : 
                                   character.rank === 2 ? 'Officer' : 
                                   character.rank === 3 ? 'Officer Alt' : 
                                   character.rank === 4 ? 'Main Raider' : 
                                   character.rank === 5 ? 'Raider' : 
                                   character.rank === 6 ? 'Raid Leader Team 2' : 
                                   character.rank === 7 ? 'Trial Raider' : 
                                   character.rank === 8 ? 'Raid Team 2' : 
                                   character.rank === 9 ? 'Member' : 
                                   'Unknown'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {character.level}
                              </TableCell>
                              <TableCell>
                                <span className={character.itemLevel >= 480 ? 'text-amber-400' : 'text-wow-light'}>
                                  {character.itemLevel || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={character.raiderIoScore >= 3000 ? 'text-amber-400' : 'text-wow-light'}>
                                  {character.raiderIoScore || '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-wow-light">
                                  {character.lastUpdated ? format(new Date(character.lastUpdated), 'MMM d') : '-'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <a 
                                    href={character.armoryUrl || "#"} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-wow-light hover:text-wow-gold p-1 rounded-md hover:bg-black/30"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </a>
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button className="text-wow-light hover:text-wow-gold p-1 rounded-md hover:bg-black/30">
                                          <Award className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent className="bg-black/90 border-wow-gold/20 text-wow-light">
                                        <p>View Logs</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button className="text-wow-light hover:text-wow-gold p-1 rounded-md hover:bg-black/30">
                                        <MoreVertical className="h-4 w-4" />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-black/95 border-wow-gold/20 text-wow-light">
                                      <DropdownMenuItem className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold">
                                        View Details
                                      </DropdownMenuItem>
                                      <DropdownMenuItem 
                                        className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                        onClick={() => updateCharacterScoreMutation.mutate(character.id)}
                                        disabled={updateCharacterScoreMutation.isPending && updateCharacterScoreMutation.variables === character.id}
                                      >
                                        {updateCharacterScoreMutation.isPending && updateCharacterScoreMutation.variables === character.id ? (
                                          <div className="flex items-center">
                                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                            Updating Score...
                                          </div>
                                        ) : (
                                          <div className="flex items-center">
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Update Score
                                          </div>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator className="bg-wow-gold/20" />
                                      <DropdownMenuItem className="cursor-pointer hover:bg-red-900/20 hover:text-red-400">
                                        Remove
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Raid Progress Section */}
          {activeSection === 'raid-progress' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="raid-tier-select" className="text-wow-gold mb-2 block font-medium">Raid Tier</Label>
                    <Select
                      value={selectedRaidTierId?.toString() || ""}
                      onValueChange={(value) => setSelectedRaidTierId(parseInt(value))}
                    >
                      <SelectTrigger id="raid-tier-select" className="bg-black/50 border-wow-gold/20 text-wow-light">
                        <SelectValue placeholder="Select Raid Tier" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-wow-gold/20 text-wow-light">
                        {isLoadingRaidTiers ? (
                          <SelectItem value="loading" disabled>Loading tiers...</SelectItem>
                        ) : raidTiersData?.tiers && raidTiersData.tiers.length > 0 ? (
                          raidTiersData.tiers.map((tier) => (
                            <SelectItem key={tier.id} value={tier.id.toString()}>
                              {tier.name} {tier.isCurrent && "(Current)"}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>No raid tiers found</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="difficulty-select" className="text-wow-gold mb-2 block font-medium">Difficulty</Label>
                    <Select
                      value={selectedDifficulty}
                      onValueChange={setSelectedDifficulty}
                    >
                      <SelectTrigger id="difficulty-select" className="bg-black/50 border-wow-gold/20 text-wow-light">
                        <SelectValue placeholder="Select Difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 border-wow-gold/20 text-wow-light">
                        <SelectItem value="mythic">Mythic</SelectItem>
                        <SelectItem value="heroic">Heroic</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold hover:border-wow-gold/30"
                    onClick={() => refreshAllDataMutation.mutate()}
                    disabled={refreshAllDataMutation.isPending}
                  >
                    {refreshAllDataMutation.isPending ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Raid Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {isLoadingBosses ? (
                <div className="space-y-6">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Card key={index} className="bg-black/50 border-wow-gold/20 shadow-lg">
                      <CardHeader className="pb-0">
                        <Skeleton className="h-8 w-64 bg-green-900/20" />
                      </CardHeader>
                      <CardContent className="pt-4">
                        <Skeleton className="h-24 w-full bg-green-900/10" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {bosses.map((boss) => (
                    <Card 
                      key={boss.id} 
                      className={`bg-black/50 border-wow-gold/20 shadow-lg overflow-hidden ${
                        boss.defeated ? 'border-l-4 border-l-green-600/70' : 
                        boss.inProgress ? 'border-l-4 border-l-amber-600/70' : ''
                      }`}
                    >
                      <CardHeader className="pb-2 flex flex-row items-start bg-gradient-to-r from-black/70 to-transparent">
                        <div className="relative mr-4 flex-shrink-0">
                          <img
                            src={getIconUrl(boss.iconUrl)}
                            alt={boss.name}
                            className="w-16 h-16 rounded-lg border border-wow-gold/40 shadow-md"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                            }}
                          />
                          {boss.defeated && (
                            <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 shadow-md border border-green-400">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-wow-gold text-xl">{boss.name}</CardTitle>
                          <div className="flex items-center mt-1">
                            {boss.defeated ? (
                              <Badge className="bg-green-900/60 text-green-300 border-green-700/70">Defeated</Badge>
                            ) : boss.pullCount && boss.pullCount > 0 ? (
                              <Badge className="bg-amber-900/60 text-amber-300 border-amber-700/70">In Progress</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-transparent text-wow-light border-wow-light/40">Not Started</Badge>
                            )}
                            {boss.lastKillDate && (
                              <span className="text-sm text-wow-light ml-3">
                                Last kill: {format(new Date(boss.lastKillDate), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-wow-light hover:text-wow-gold hover:bg-black/30">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="bg-black/95 border-wow-gold/20 text-wow-light">
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                onClick={() => {
                                  handleBossUpdate(boss, 'defeated', !boss.defeated);
                                  if (!boss.defeated) {
                                    // If marking as defeated, also set current date
                                    handleBossUpdate(boss, 'lastKillDate', new Date().toISOString());
                                  }
                                }}
                              >
                                {boss.defeated ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    <span>Mark as Not Defeated</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    <span>Mark as Defeated</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                onClick={() => {
                                  if (!boss.defeated) {
                                    handleBossUpdate(boss, 'inProgress', !boss.inProgress);
                                  }
                                }}
                                disabled={boss.defeated}
                              >
                                {boss.inProgress ? (
                                  <>
                                    <XCircle className="h-4 w-4 mr-2" />
                                    <span>Remove In Progress</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>Mark as In Progress</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="bg-wow-gold/20" />
                              <DropdownMenuItem className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold">
                                <Award className="h-4 w-4 mr-2" />
                                <span>View Logs</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <Tabs defaultValue="status" className="w-full">
                          <TabsList className="bg-black/30 border border-wow-gold/10 mb-4">
                            <TabsTrigger 
                              value="status" 
                              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-wow-gold"
                            >
                              Status
                            </TabsTrigger>
                            <TabsTrigger 
                              value="performance" 
                              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-wow-gold"
                            >
                              Performance
                            </TabsTrigger>
                            <TabsTrigger 
                              value="details" 
                              className="data-[state=active]:bg-green-900/30 data-[state=active]:text-wow-gold"
                            >
                              Details
                            </TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="status" className="mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-wow-gold font-medium mb-2">Boss Status</p>
                                <div className="flex flex-col space-y-3">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`defeated-${boss.id}`}
                                      checked={boss.defeated || false}
                                      onChange={(e) => {
                                        handleBossUpdate(boss, 'defeated', e.target.checked);
                                        if (e.target.checked) {
                                          // If marking as defeated, automatically set inProgress to false
                                          handleBossUpdate(boss, 'inProgress', false);
                                          // Also set current date if not already set
                                          if (!boss.lastKillDate) {
                                            handleBossUpdate(boss, 'lastKillDate', new Date().toISOString());
                                          }
                                        }
                                      }}
                                      className="mr-2 rounded accent-green-600"
                                    />
                                    <Label 
                                      htmlFor={`defeated-${boss.id}`}
                                      className="text-wow-light cursor-pointer"
                                    >
                                      Boss Defeated
                                    </Label>
                                  </div>
                                  
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      id={`in-progress-${boss.id}`}
                                      checked={boss.inProgress || false}
                                      disabled={boss.defeated || false}
                                      onChange={(e) => handleBossUpdate(boss, 'inProgress', e.target.checked)}
                                      className="mr-2 rounded accent-amber-600"
                                    />
                                    <Label 
                                      htmlFor={`in-progress-${boss.id}`}
                                      className={`cursor-pointer ${boss.defeated ? 'text-wow-light/50' : 'text-wow-light'}`}
                                    >
                                      In Progress
                                    </Label>
                                  </div>
                                  
                                  <div className="pt-2">
                                    <Label htmlFor={`pulls-${boss.id}`} className="text-wow-light mb-1 block">
                                      Pull Count
                                    </Label>
                                    <Input
                                      id={`pulls-${boss.id}`}
                                      type="number"
                                      min="0"
                                      value={boss.pullCount || 0}
                                      className="bg-black/50 border-wow-gold/20 text-wow-light"
                                      onChange={(e) => handleBossUpdate(boss, 'pullCount', parseInt(e.target.value, 10))}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-wow-gold font-medium mb-2">Kill Information</p>
                                <div className="space-y-3">
                                  <div>
                                    <Label htmlFor={`best-time-${boss.id}`} className="text-wow-light mb-1 block">
                                      Best Kill Time (MM:SS)
                                    </Label>
                                    <Input
                                      id={`best-time-${boss.id}`}
                                      value={boss.bestTime || ""}
                                      placeholder="e.g. 5:42"
                                      className="bg-black/50 border-wow-gold/20 text-wow-light"
                                      onChange={(e) => handleBossUpdate(boss, 'bestTime', e.target.value)}
                                    />
                                  </div>
                                  
                                  <div>
                                    <Label htmlFor={`last-kill-date-${boss.id}`} className="text-wow-light mb-1 block">
                                      Last Kill Date
                                    </Label>
                                    <Input
                                      id={`last-kill-date-${boss.id}`}
                                      type="date"
                                      value={boss.lastKillDate ? new Date(boss.lastKillDate).toISOString().split('T')[0] : ""}
                                      className="bg-black/50 border-wow-gold/20 text-wow-light"
                                      onChange={(e) => handleBossUpdate(boss, 'lastKillDate', e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="performance" className="mt-0">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`best-parse-${boss.id}`} className="text-wow-light mb-1 block">
                                  Best Parse
                                </Label>
                                <Input
                                  id={`best-parse-${boss.id}`}
                                  value={boss.bestParse || ""}
                                  placeholder="e.g. 92"
                                  className="bg-black/50 border-wow-gold/20 text-wow-light"
                                  onChange={(e) => handleBossUpdate(boss, 'bestParse', e.target.value)}
                                />
                              </div>
                              
                              <div>
                                <p className="text-wow-gold font-medium mb-2">Warcraftlogs Data</p>
                                <div className="bg-black/30 rounded-lg p-4 text-center">
                                  {boss.warcraftLogsUrl ? (
                                    <div className="text-center">
                                      <Button variant="outline" className="text-wow-light border-wow-gold/30 bg-black/30 hover:bg-black/50">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open in Warcraftlogs
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-wow-light">No Warcraftlogs data available</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="details" className="mt-0">
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor={`icon-url-${boss.id}`} className="text-wow-light mb-1 block">
                                  Icon URL (name only, e.g. "inv_sword_01")
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`icon-url-${boss.id}`}
                                    value={boss.iconUrl || ""}
                                    placeholder="e.g. inv_sword_01"
                                    className="bg-black/50 border-wow-gold/20 text-wow-light"
                                    onChange={(e) => handleBossUpdate(boss, 'iconUrl', e.target.value)}
                                  />
                                  <div className="w-10 h-10 flex-shrink-0 rounded border border-wow-gold/20 overflow-hidden">
                                    <img
                                      src={getIconUrl(boss.iconUrl)}
                                      alt="Icon Preview"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <Label htmlFor={`sort-order-${boss.id}`} className="text-wow-light mb-1 block">
                                  Sort Order (lower numbers appear first)
                                </Label>
                                <Input
                                  id={`sort-order-${boss.id}`}
                                  type="number"
                                  min="1"
                                  value={boss.sortOrder || ""}
                                  className="bg-black/50 border-wow-gold/20 text-wow-light"
                                  onChange={(e) => handleBossUpdate(boss, 'sortOrder', parseInt(e.target.value, 10))}
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`raid-name-${boss.id}`} className="text-wow-light mb-1 block">
                                  Raid Name
                                </Label>
                                <Input
                                  id={`raid-name-${boss.id}`}
                                  value={boss.raidName || ""}
                                  className="bg-black/50 border-wow-gold/20 text-wow-light"
                                  disabled
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Applications Section */}
          {activeSection === 'applications' && (
            <div className="space-y-6">
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="text-wow-gold">Applications Management</CardTitle>
                    <CardDescription className="text-wow-light">Review and manage guild applications</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select 
                      defaultValue="all" 
                      value={applicationStatusFilter} 
                      onValueChange={(val) => setApplicationStatusFilter(val)}
                    >
                      <SelectTrigger className="w-[150px] bg-black/50 border-wow-gold/30 text-wow-light">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                        <SelectItem value="all">All Applications</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input 
                      placeholder="Search applications..." 
                      className="max-w-sm bg-black/50 border-wow-gold/30 text-wow-light"
                      value={applicationSearchQuery}
                      onChange={(e) => setApplicationSearchQuery(e.target.value)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border border-wow-gold/20 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-black/70">
                        <TableRow className="border-b-wow-gold/20 hover:bg-black/50">
                          <TableHead className="text-wow-gold">Character</TableHead>
                          <TableHead className="text-wow-gold">Class/Spec</TableHead>
                          <TableHead className="text-wow-gold">Item Level</TableHead>
                          <TableHead className="text-wow-gold">Status</TableHead>
                          <TableHead className="text-wow-gold">Submitted</TableHead>
                          <TableHead className="text-wow-gold text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingApplications ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              <div className="flex items-center justify-center">
                                <div className="w-10 h-10 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : !applicationsData?.applications || applicationsData.applications.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-wow-light">
                              No applications found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          applicationsData.applications.map((application) => (
                            <TableRow key={application.id} className="border-b-wow-gold/10 hover:bg-black/30">
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className={`h-8 w-8 rounded-full border border-wow-gold/30 ${getClassBgColor(application.className)}`}
                                    style={{ backgroundImage: `url(${getClassIconUrl(application.className)})`, backgroundSize: 'cover' }}
                                  ></div>
                                  <div>
                                    <p className="text-wow-light font-medium">{application.characterName}</p>
                                    <p className="text-wow-light text-xs">{application.realm}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <span className={getClassColor(application.className)}>{application.className}</span>
                                  <span className="text-wow-light">/</span>
                                  <span className="text-wow-light">{application.specName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-wow-light">{application.itemLevel}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    application.status === 'pending' 
                                      ? "bg-yellow-800/30 text-yellow-400 border-yellow-500/30"
                                      : application.status === 'approved'
                                        ? "bg-green-800/30 text-green-400 border-green-500/30"
                                        : "bg-red-800/30 text-red-400 border-red-500/30"
                                  }
                                >
                                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-wow-light">
                                {application.createdAt 
                                  ? format(new Date(application.createdAt), 'MMM dd, yyyy') 
                                  : 'N/A'}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end space-x-2">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-8 w-8 p-0 text-wow-light hover:text-wow-gold"
                                    onClick={() => setSelectedApplication(application)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-wow-light hover:text-wow-gold">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-black/95 border-wow-gold/20 text-wow-light min-w-[160px]">
                                      {application.status !== 'approved' && (
                                        <DropdownMenuItem 
                                          className="cursor-pointer hover:bg-green-900/20 hover:text-green-400"
                                          onClick={() => {
                                            setSelectedApplication(application);
                                            setReviewNote('');
                                            changeApplicationStatusMutation.mutate({
                                              applicationId: application.id,
                                              status: 'approved',
                                              reviewNote: ''
                                            });
                                          }}
                                        >
                                          <CheckCircle className="h-4 w-4 mr-2" />
                                          Approve
                                        </DropdownMenuItem>
                                      )}
                                      {application.status !== 'pending' && (
                                        <DropdownMenuItem 
                                          className="cursor-pointer hover:bg-yellow-900/20 hover:text-yellow-400"
                                          onClick={() => {
                                            setSelectedApplication(application);
                                            setReviewNote('');
                                            changeApplicationStatusMutation.mutate({
                                              applicationId: application.id,
                                              status: 'pending',
                                              reviewNote: ''
                                            });
                                          }}
                                        >
                                          <Clock className="h-4 w-4 mr-2" />
                                          Set to Pending
                                        </DropdownMenuItem>
                                      )}
                                      {application.status !== 'rejected' && (
                                        <DropdownMenuItem 
                                          className="cursor-pointer hover:bg-red-900/20 hover:text-red-400"
                                          onClick={() => {
                                            setSelectedApplication(application);
                                            setReviewNote('');
                                            changeApplicationStatusMutation.mutate({
                                              applicationId: application.id,
                                              status: 'rejected',
                                              reviewNote: ''
                                            });
                                          }}
                                        >
                                          <XCircle className="h-4 w-4 mr-2" />
                                          Reject
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator className="bg-wow-gold/20" />
                                      <DropdownMenuItem 
                                        className="cursor-pointer hover:bg-blue-900/20 hover:text-blue-400"
                                        onClick={() => {
                                          setSelectedApplication(application);
                                          setCommentText('');
                                        }}
                                      >
                                        <FileText className="h-4 w-4 mr-2" />
                                        Add Comment
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-wow-light text-sm">
                      {applicationsData && applicationsData?.applications?.length > 0 
                        ? `Showing ${applicationsData.applications.length} of ${applicationsData.totalApplications} applications` 
                        : 'No applications found'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-wow-gold/30 bg-black/30 text-wow-light hover:bg-black/50 hover:text-wow-gold"
                        disabled={true} // Implement pagination when needed
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="border-wow-gold/30 bg-black/30 text-wow-light hover:bg-black/50 hover:text-wow-gold"
                        disabled={true} // Implement pagination when needed
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Application Details Dialog */}
          <Dialog open={!!selectedApplication} onOpenChange={(open) => !open && setSelectedApplication(null)}>
            <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light max-w-3xl max-h-[90vh] overflow-y-auto">
              {selectedApplication && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-wow-gold flex items-center gap-2">
                      <div 
                        className={`h-6 w-6 rounded-full border border-wow-gold/30 ${getClassBgColor(selectedApplication.className)}`}
                        style={{ backgroundImage: `url(${getClassIconUrl(selectedApplication.className)})`, backgroundSize: 'cover' }}
                      ></div>
                      Application from {selectedApplication.characterName}
                    </DialogTitle>
                    <DialogDescription className="text-wow-light">
                      {selectedApplication.className} / {selectedApplication.specName} - {selectedApplication.itemLevel} ilvl - {selectedApplication.realm}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    {/* Application Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <p className="text-wow-light">Status:</p>
                        <Badge 
                          className={
                            selectedApplication.status === 'pending' 
                              ? "bg-yellow-800/30 text-yellow-400 border-yellow-500/30"
                              : selectedApplication.status === 'approved'
                                ? "bg-green-800/30 text-green-400 border-green-500/30"
                                : "bg-red-800/30 text-red-400 border-red-500/30"
                          }
                        >
                          {selectedApplication.status.charAt(0).toUpperCase() + selectedApplication.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-wow-light text-sm">
                        Submitted: {selectedApplication.createdAt 
                          ? format(new Date(selectedApplication.createdAt), 'MMM dd, yyyy, HH:mm') 
                          : 'N/A'}
                      </p>
                    </div>
                    
                    {/* Application Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-wow-gold font-medium mb-1">Experience</h4>
                          <p className="text-wow-light bg-black/50 p-3 rounded border border-wow-gold/10 whitespace-pre-line">
                            {selectedApplication.experience || 'No experience provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-wow-gold font-medium mb-1">Availability</h4>
                          <p className="text-wow-light bg-black/50 p-3 rounded border border-wow-gold/10 whitespace-pre-line">
                            {selectedApplication.availability || 'No availability provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-wow-gold font-medium mb-1">Why Join Guttakrutt</h4>
                          <p className="text-wow-light bg-black/50 p-3 rounded border border-wow-gold/10 whitespace-pre-line">
                            {selectedApplication.whyJoin || 'No reason provided'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-wow-gold font-medium mb-1">Contact Info</h4>
                          <p className="text-wow-light bg-black/50 p-3 rounded border border-wow-gold/10">
                            {selectedApplication.contactInfo || 'No contact info provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-wow-gold font-medium mb-1">Logs</h4>
                          <p className="text-wow-light bg-black/50 p-3 rounded border border-wow-gold/10 break-all">
                            {selectedApplication.logs ? (
                              <a 
                                href={selectedApplication.logs} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline"
                              >
                                {selectedApplication.logs}
                              </a>
                            ) : 'No logs provided'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-wow-gold font-medium mb-1">Additional Info</h4>
                          <p className="text-wow-light bg-black/50 p-3 rounded border border-wow-gold/10 whitespace-pre-line">
                            {selectedApplication.additionalInfo || 'No additional info provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Comments Section */}
                    <div className="border-t border-wow-gold/20 pt-4 mt-6">
                      <h3 className="text-wow-gold font-medium mb-3">Comments</h3>
                      
                      <div className="space-y-4 max-h-[300px] overflow-y-auto mb-4">
                        {isLoadingApplicationComments ? (
                          <div className="flex justify-center py-4">
                            <div className="w-8 h-8 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                          </div>
                        ) : applicationCommentsData?.comments && applicationCommentsData.comments.length > 0 ? (
                          applicationCommentsData.comments.map((comment) => (
                            <div key={comment.id} className="bg-black/30 p-3 rounded border border-wow-gold/10">
                              <div className="flex justify-between items-start mb-2">
                                <p className="text-wow-gold font-medium">{comment.adminUsername || 'Admin'}</p>
                                <p className="text-wow-light text-xs">
                                  {comment.createdAt ? format(new Date(comment.createdAt), 'MMM dd, yyyy, HH:mm') : 'N/A'}
                                </p>
                              </div>
                              <p className="text-wow-light whitespace-pre-line">{comment.comment}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-wow-light text-center py-4">No comments yet</p>
                        )}
                      </div>
                      
                      {/* Add Comment Form */}
                      <div className="flex gap-2">
                        <Textarea 
                          placeholder="Add a comment..."
                          className="bg-black/50 border-wow-gold/30 text-wow-light resize-none"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                        />
                        <Button 
                          className="bg-green-800 hover:bg-green-700 text-wow-light self-end"
                          onClick={() => {
                            if (commentText.trim() && selectedApplication) {
                              addApplicationCommentMutation.mutate({
                                applicationId: selectedApplication.id,
                                comment: commentText
                              });
                            }
                          }}
                          disabled={!commentText.trim() || addApplicationCommentMutation.isPending}
                        >
                          {addApplicationCommentMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Review Notes */}
                    <div className="border-t border-wow-gold/20 pt-4 mt-6">
                      <h3 className="text-wow-gold font-medium mb-3">Review Notes</h3>
                      <Textarea 
                        placeholder="Add admin notes about this application (visible only to admins)"
                        className="bg-black/50 border-wow-gold/30 text-wow-light resize-none"
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                      />
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2 border-t border-wow-gold/20 pt-4 mt-6">
                      {selectedApplication.status !== 'approved' && (
                        <Button 
                          className="bg-green-800 hover:bg-green-700 text-wow-light"
                          onClick={() => {
                            changeApplicationStatusMutation.mutate({
                              applicationId: selectedApplication.id,
                              status: 'approved',
                              reviewNote: reviewNote
                            });
                          }}
                          disabled={changeApplicationStatusMutation.isPending}
                        >
                          {changeApplicationStatusMutation.isPending && selectedApplication.status !== 'approved' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve
                        </Button>
                      )}
                      
                      {selectedApplication.status !== 'pending' && (
                        <Button 
                          className="bg-yellow-800 hover:bg-yellow-700 text-wow-light"
                          onClick={() => {
                            changeApplicationStatusMutation.mutate({
                              applicationId: selectedApplication.id,
                              status: 'pending',
                              reviewNote: reviewNote
                            });
                          }}
                          disabled={changeApplicationStatusMutation.isPending}
                        >
                          {changeApplicationStatusMutation.isPending && selectedApplication.status !== 'pending' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Clock className="h-4 w-4 mr-2" />
                          )}
                          Set to Pending
                        </Button>
                      )}
                      
                      {selectedApplication.status !== 'rejected' && (
                        <Button 
                          className="bg-red-800 hover:bg-red-700 text-wow-light"
                          onClick={() => {
                            changeApplicationStatusMutation.mutate({
                              applicationId: selectedApplication.id,
                              status: 'rejected',
                              reviewNote: reviewNote
                            });
                          }}
                          disabled={changeApplicationStatusMutation.isPending}
                        >
                          {changeApplicationStatusMutation.isPending && selectedApplication.status !== 'rejected' ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
          
          {/* Analytics Section */}
          {activeSection === 'analytics' && (
            <div className="space-y-6">
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold">Guild Class Distribution</CardTitle>
                  <CardDescription className="text-wow-light">Breakdown of classes in Guttakrutt</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex flex-col items-center justify-center">
                  {isLoadingMembers ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {guildSummary.classDistribution.map((classData) => (
                          <div key={classData.className} className="flex items-center space-x-3 p-2 rounded-lg bg-black/30 border border-wow-gold/10">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getClassBgColor(classData.className)}`}>
                              <img 
                                src={getClassIconUrl(classData.className)}
                                alt={classData.className}
                                className="w-8 h-8 object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg";
                                }}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <p className={`text-sm font-medium ${getClassColor(classData.className)}`}>
                                  {classData.className}
                                </p>
                                <p className="text-wow-gold text-sm font-semibold">{classData.count} ({Math.round((classData.count / guildSummary.totalMembers) * 100)}%)</p>
                              </div>
                              <div className="w-full h-3 bg-black/50 rounded-full mt-1 overflow-hidden">
                                <div 
                                  className={`h-3 ${getClassBgColor(classData.className)}`}
                                  style={{ width: `${(classData.count / guildSummary.totalMembers) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-wow-gold">Raid Progress Overview</CardTitle>
                    <CardDescription className="text-wow-light">Current raid progress status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingBosses ? (
                      <div className="w-full h-[200px] flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {guildSummary.raidProgress.map((raid) => (
                          <div key={raid.raidName}>
                            <div className="flex justify-between items-center mb-2">
                              <p className="text-wow-gold font-medium">{raid.raidName}</p>
                              <p className="text-wow-light text-sm">{raid.bossesDefeated}/{raid.totalBosses} defeated</p>
                            </div>
                            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden">
                              <div 
                                className="h-2 bg-green-600"
                                style={{ width: `${(raid.bossesDefeated / raid.totalBosses) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-wow-gold">Role Distribution</CardTitle>
                    <CardDescription className="text-wow-light">Tank, Healer, DPS breakdown</CardDescription>
                  </CardHeader>
                  <CardContent className="text-wow-light">
                    {isLoadingMembers ? (
                      <div className="w-full h-[200px] flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {guildSummary.roleDistribution.map((role) => (
                          <div key={role.role} className="flex flex-col items-center p-4 rounded-lg bg-black/30 border border-wow-gold/10">
                            <div className="w-16 h-16 rounded-full mb-2 flex items-center justify-center bg-gradient-to-br from-wow-gold/20 to-wow-gold/5 border border-wow-gold/30">
                              <img 
                                src={getRoleIcon(role.role)}
                                alt={role.role}
                                className="w-10 h-10 object-contain"
                              />
                            </div>
                            <p className="text-wow-gold font-semibold">{role.role}</p>
                            <p className="text-4xl font-bold text-wow-light">{role.count}</p>
                            <p className="text-wow-light text-sm">
                              {Math.round((role.count / guildSummary.totalMembers) * 100)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold">Member Activity</CardTitle>
                  <CardDescription className="text-wow-light">Recent character updates</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] pt-6">
                  {isLoadingMembers ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-12 h-12 border-4 border-wow-gold rounded-full border-t-transparent animate-spin"></div>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-end">
                      {guildSummary.memberActivity.map((activity, index) => (
                        <div 
                          key={index} 
                          className="flex-1 flex flex-col items-center justify-end h-full"
                        >
                          <div 
                            className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t"
                            style={{ 
                              height: `${(activity.count / Math.max(...guildSummary.memberActivity.map(a => a.count))) * 100}%`,
                              minHeight: '20px'
                            }}
                          ></div>
                          <p className="text-xs text-wow-light mt-2 transform -rotate-45 origin-top-left">{activity.date}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Content Management Section */}
          {activeSection === 'content' && (
            <div className="space-y-6">
              <Tabs defaultValue="website" className="w-full">
                <TabsList className="bg-black/50 border border-wow-gold/20 p-1">
                  <TabsTrigger 
                    value="website" 
                    className="data-[state=active]:bg-green-900/50 data-[state=active]:text-wow-gold data-[state=active]:shadow-sm text-wow-light"
                  >
                    Website Content
                  </TabsTrigger>
                  <TabsTrigger 
                    value="translations" 
                    className="data-[state=active]:bg-green-900/50 data-[state=active]:text-wow-gold data-[state=active]:shadow-sm text-wow-light"
                  >
                    Translations
                  </TabsTrigger>
                  <TabsTrigger 
                    value="media" 
                    className="data-[state=active]:bg-green-900/50 data-[state=active]:text-wow-gold data-[state=active]:shadow-sm text-wow-light"
                  >
                    Media Library
                  </TabsTrigger>
                </TabsList>
                
                {/* Website Content Tab */}
                <TabsContent value="website">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-wow-gold">Website Content Management</CardTitle>
                      <CardDescription className="text-wow-light">Edit website sections and pages</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button 
                            className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                            onClick={() => {
                              toast({
                                title: "Add Content Feature",
                                description: "This button will open a content creation dialog in a future update.",
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Content
                          </Button>
                        </div>
                        
                        {isLoadingWebsiteContent ? (
                          <div className="space-y-3 py-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                              <Skeleton key={index} className="h-12 w-full bg-green-900/10" />
                            ))}
                          </div>
                        ) : websiteContentData?.content && websiteContentData.content.length > 0 ? (
                          <div className="border border-wow-gold/20 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader className="bg-black/70">
                                <TableRow className="border-b-wow-gold/20 hover:bg-black/50">
                                  <TableHead className="text-wow-gold">Content Key</TableHead>
                                  <TableHead className="text-wow-gold">Title</TableHead>
                                  <TableHead className="text-wow-gold">Type</TableHead>
                                  <TableHead className="text-wow-gold">Last Updated</TableHead>
                                  <TableHead className="text-wow-gold text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {websiteContentData.content.map((content) => (
                                  <TableRow key={content.id} className="border-b-wow-gold/10 hover:bg-black/30">
                                    <TableCell className="text-wow-light">{content.key}</TableCell>
                                    <TableCell className="text-wow-light">{content.title || 'Untitled'}</TableCell>
                                    <TableCell className="text-wow-light">
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          content.type === 'Hero' 
                                            ? "bg-blue-900/30 text-blue-400 border-blue-500/30"
                                            : "bg-green-900/30 text-green-400 border-green-500/30"
                                        }
                                      >
                                        {content.type || 'Text'}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-wow-light">
                                      {content.updated_at ? format(new Date(content.updated_at), 'yyyy-MM-dd') : 'N/A'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-8 w-8 p-0 text-wow-light hover:text-wow-gold"
                                          onClick={() => {
                                            toast({
                                              title: "Edit Content",
                                              description: `Editing ${content.title || content.key} will be available in a future update.`,
                                            });
                                          }}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button 
                                          size="sm" 
                                          variant="ghost" 
                                          className="h-8 w-8 p-0 text-wow-light hover:text-red-400"
                                          onClick={() => {
                                            toast({
                                              title: "Delete Content",
                                              description: `Content deletion for ${content.title || content.key} will be available in a future update.`,
                                              variant: "destructive",
                                            });
                                          }}
                                        >
                                          <Trash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <Card className="bg-black/30 border-wow-gold/10">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                              <FileText className="h-12 w-12 text-wow-gold/40 mb-4" />
                              <h3 className="text-wow-gold text-lg font-semibold mb-2">No Content Found</h3>
                              <p className="text-wow-light mb-4">You haven't added any website content yet.</p>
                              <Button 
                                className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                onClick={() => {
                                  toast({
                                    title: "Add Content",
                                    description: "Content creation dialog will be added in a future update.",
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Content
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Translations Tab */}
                <TabsContent value="translations">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-wow-gold">Translation Management</CardTitle>
                      <CardDescription className="text-wow-light">Manage multi-language content (English/Norwegian)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button 
                            className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                            onClick={() => {
                              toast({
                                title: "Add Translation",
                                description: "Translation creation dialog will be added in a future update.",
                              });
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Translation
                          </Button>
                        </div>
                        
                        {isLoadingTranslations ? (
                          <div className="space-y-3 py-4">
                            {Array.from({ length: 3 }).map((_, index) => (
                              <Skeleton key={index} className="h-12 w-full bg-green-900/10" />
                            ))}
                          </div>
                        ) : translationsData?.translations && translationsData.translations.length > 0 ? (
                          <div className="border border-wow-gold/20 rounded-lg overflow-hidden">
                            <Table>
                              <TableHeader className="bg-black/70">
                                <TableRow className="border-b-wow-gold/20 hover:bg-black/50">
                                  <TableHead className="text-wow-gold">Key</TableHead>
                                  <TableHead className="text-wow-gold">English</TableHead>
                                  <TableHead className="text-wow-gold">Norwegian</TableHead>
                                  <TableHead className="text-wow-gold text-right">Actions</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {translationsData.translations.map((translation) => (
                                  <TableRow key={translation.key} className="border-b-wow-gold/10 hover:bg-black/30">
                                    <TableCell className="text-wow-light">{translation.key}</TableCell>
                                    <TableCell className="text-wow-light">{translation.en_text}</TableCell>
                                    <TableCell className="text-wow-light">{translation.no_text}</TableCell>
                                    <TableCell className="text-right">
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 w-8 p-0 text-wow-light hover:text-wow-gold"
                                        onClick={() => {
                                          toast({
                                            title: "Edit Translation",
                                            description: `Translation editing for "${translation.key}" will be added in a future update.`,
                                          });
                                        }}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <Card className="bg-black/30 border-wow-gold/10">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                              <Languages className="h-12 w-12 text-wow-gold/40 mb-4" />
                              <h3 className="text-wow-gold text-lg font-semibold mb-2">No Translations Found</h3>
                              <p className="text-wow-light mb-4">You haven't added any translations yet.</p>
                              <Button 
                                className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                onClick={() => {
                                  toast({
                                    title: "Add First Translation",
                                    description: "Translation creation dialog will be added in a future update.",
                                  });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Add First Translation
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Media Library Tab */}
                <TabsContent value="media">
                  <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                    <CardHeader>
                      <CardTitle className="text-wow-gold">Media Library</CardTitle>
                      <CardDescription className="text-wow-light">Manage images and other media files</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-end">
                          <Button 
                            className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                            onClick={() => {
                              toast({
                                title: "Upload Media",
                                description: "Media upload dialog will be added in a future update.",
                              });
                            }}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Media
                          </Button>
                        </div>
                        
                        {isLoadingMediaFiles ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map((_, index) => (
                              <Skeleton key={index} className="aspect-video bg-green-900/10 rounded-lg" />
                            ))}
                          </div>
                        ) : mediaFilesData?.files && mediaFilesData.files.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {mediaFilesData.files.map((file) => (
                              <div key={file.id} className="rounded-lg overflow-hidden border border-wow-gold/20 bg-black/30">
                                <div className="aspect-video relative group">
                                  <img 
                                    src={file.url || `/uploads/${file.filename}`} 
                                    alt={file.original_name} 
                                    className="w-full h-full object-cover" 
                                  />
                                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 text-wow-light hover:text-wow-gold"
                                      onClick={() => {
                                        toast({
                                          title: "View Media",
                                          description: `Viewing ${file.original_name} will be added in a future update.`,
                                        });
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-8 w-8 p-0 text-wow-light hover:text-red-400"
                                      onClick={() => {
                                        toast({
                                          title: "Delete Media",
                                          description: `Deleting ${file.original_name} will be added in a future update.`,
                                          variant: "destructive",
                                        });
                                      }}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="p-2">
                                  <p className="text-wow-gold text-sm truncate">{file.original_name}</p>
                                  <p className="text-wow-light text-xs">
                                    {file.size ? `${Math.round(file.size / 1024)} KB` : 'Size unknown'} 
                                    {file.uploaded_at ? ` - Uploaded ${format(new Date(file.uploaded_at), 'PP')}` : ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <Card className="bg-black/30 border-wow-gold/10">
                            <CardContent className="p-8 flex flex-col items-center justify-center text-center">
                              <ImageIcon className="h-12 w-12 text-wow-gold/40 mb-4" />
                              <h3 className="text-wow-gold text-lg font-semibold mb-2">No Media Files Found</h3>
                              <p className="text-wow-light mb-4">You haven't uploaded any media files yet.</p>
                              <Button 
                                className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                onClick={() => {
                                  toast({
                                    title: "Upload Media",
                                    description: "Media upload dialog will be added in a future update.",
                                  });
                                }}
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Upload First Media
                              </Button>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          {/* System Logs Section */}
          {activeSection === 'logs' && (
            <div className="space-y-6">
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold">System Logs</CardTitle>
                  <CardDescription className="text-wow-light">View system activity and diagnostic information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between mb-4">
                    <div className="flex space-x-2">
                      <Select
                        value={logsTabActive}
                        onValueChange={setLogsTabActive}
                      >
                        <SelectTrigger className="w-[180px] bg-black/40 border-wow-gold/30">
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                          <SelectItem value="system">System Logs</SelectItem>
                          <SelectItem value="api">API Requests</SelectItem>
                          <SelectItem value="admin">Admin Activity</SelectItem>
                          <SelectItem value="error">Error Logs</SelectItem>
                          <SelectItem value="all">All Logs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={() => refetchLogs()}
                      className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50 shadow-md"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Logs
                    </Button>
                  </div>
                  
                  {isLoadingLogs ? (
                    <div className="flex justify-center items-center p-8">
                      <Loader2 className="h-8 w-8 animate-spin text-wow-gold" />
                    </div>
                  ) : (
                    <LogsPanel 
                      logs={logsData?.logs || []} 
                      filterType={logsTabActive}
                      hideHeader={true}
                    />
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Error Testing Section */}
          {activeSection === 'error-testing' && (
            <div className="space-y-6">
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                    Error Testing Tool
                  </CardTitle>
                  <CardDescription className="text-wow-light">
                    Use these tools to test the error handling capabilities of the application. All errors will be logged and can be viewed in the System Logs section.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 border border-amber-500/20 rounded-lg bg-amber-950/20 mb-6">
                    <h3 className="text-amber-400 font-medium mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Warning
                    </h3>
                    <p className="text-wow-light/80 text-sm">
                      This tool is for testing purposes only. It intentionally generates errors to verify that the application's error handling mechanisms are working correctly.
                      All errors are caught and logged appropriately.
                    </p>
                  </div>
                  
                  <div className="w-full">
                    <ErrorTester />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Settings Section */}
          {activeSection === 'raid-tiers' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expansions Management */}
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg lg:col-span-1">
                  <CardHeader className="pb-2 bg-gradient-to-r from-green-900/30 to-green-800/10">
                    <CardTitle className="text-wow-gold text-xl flex items-center">
                      <BookOpen className="h-6 w-6 mr-2 text-green-400" />
                      Expansions
                    </CardTitle>
                    <CardDescription className="text-wow-light">
                      Manage World of Warcraft expansions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isLoadingExpansions ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-wow-gold/60" />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-4">
                          {expansionsData?.expansions?.map((expansion) => (
                            <div 
                              key={expansion.id} 
                              className={`p-3 border rounded-lg flex justify-between items-center cursor-pointer transition-colors ${
                                selectedExpansionId === expansion.id 
                                  ? 'bg-wow-gold/20 border-wow-gold/50' 
                                  : 'border-wow-gold/20 hover:bg-wow-gold/10'
                              }`}
                              onClick={() => setSelectedExpansionId(expansion.id)}
                            >
                              <div>
                                <h3 className="text-wow-gold font-medium">{expansion.name}</h3>
                                <div className="text-wow-light text-sm">
                                  {expansion.isActive ? (
                                    <Badge className="bg-green-900/30 text-green-400 border-green-500/30">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-wow-light">
                                      Inactive
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreVertical className="h-4 w-4 text-wow-light" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent className="bg-black/95 border-wow-gold/20 text-wow-light">
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <DropdownMenuItem 
                                          className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Edit className="mr-2 h-4 w-4" /> 
                                          <span>Edit</span>
                                        </DropdownMenuItem>
                                      </DialogTrigger>
                                      <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                                        <DialogHeader>
                                          <DialogTitle className="text-wow-gold text-xl">Edit Expansion</DialogTitle>
                                        </DialogHeader>
                                        <form
                                          onSubmit={(e) => {
                                            e.preventDefault();
                                            const formData = new FormData(e.currentTarget);
                                            const name = formData.get('name') as string;
                                            const shortName = formData.get('shortName') as string;
                                            const order = parseInt(formData.get('order') as string);
                                            const isActive = formData.get('isActive') === 'on';
                                            
                                            updateExpansionMutation.mutate({
                                              id: expansion.id,
                                              expansionData: {
                                                name,
                                                shortName,
                                                order,
                                                isActive
                                              }
                                            });
                                          }}
                                        >
                                          <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                              <Label htmlFor="name" className="text-wow-gold">Name</Label>
                                              <Input
                                                id="name"
                                                name="name"
                                                defaultValue={expansion.name}
                                                required
                                                className="bg-black/50 border-wow-gold/30 text-wow-light"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="shortName" className="text-wow-gold">Short Name</Label>
                                              <Input
                                                id="shortName"
                                                name="shortName"
                                                defaultValue={expansion.shortName}
                                                required
                                                className="bg-black/50 border-wow-gold/30 text-wow-light"
                                              />
                                            </div>
                                            <div className="space-y-2">
                                              <Label htmlFor="order" className="text-wow-gold">Order</Label>
                                              <Input
                                                id="order"
                                                name="order"
                                                type="number"
                                                defaultValue={expansion.order}
                                                required
                                                className="bg-black/50 border-wow-gold/30 text-wow-light"
                                              />
                                              <p className="text-xs text-wow-light">Higher numbers appear first</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                              <Checkbox 
                                                id="isActive" 
                                                name="isActive"
                                                defaultChecked={expansion.isActive}
                                              />
                                              <Label htmlFor="isActive" className="text-wow-gold">Active Expansion</Label>
                                            </div>
                                          </div>
                                          <DialogFooter>
                                            <Button 
                                              type="submit" 
                                              className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                            >
                                              Save Changes
                                            </Button>
                                          </DialogFooter>
                                        </form>
                                      </DialogContent>
                                    </Dialog>
                                    {!expansion.isActive && (
                                      <DropdownMenuItem 
                                        className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                        onClick={() => {
                                          updateExpansionMutation.mutate({
                                            id: expansion.id,
                                            expansionData: { isActive: true }
                                          });
                                        }}
                                      >
                                        <CheckCircle className="mr-2 h-4 w-4" /> 
                                        <span>Set as Active</span>
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full mt-4 bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Expansion
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                            <DialogHeader>
                              <DialogTitle className="text-wow-gold text-xl">Add New Expansion</DialogTitle>
                              <DialogDescription className="text-wow-light">
                                Create a new World of Warcraft expansion
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const name = formData.get('name') as string;
                                const shortName = formData.get('shortName') as string;
                                const order = parseInt(formData.get('order') as string);
                                const isActive = formData.get('isActive') === 'on';
                                
                                // Format the date as an ISO string for proper handling
                                const releaseDate = new Date().toISOString();
                                
                                createExpansionMutation.mutate({
                                  name,
                                  shortName,
                                  order,
                                  isActive,
                                  releaseDate
                                });
                              }}
                            >
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="newName" className="text-wow-gold">Name</Label>
                                  <Input
                                    id="newName"
                                    name="name"
                                    placeholder="e.g. The War Within"
                                    required
                                    className="bg-black/50 border-wow-gold/30 text-wow-light"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newShortName" className="text-wow-gold">Short Name</Label>
                                  <Input
                                    id="newShortName"
                                    name="shortName"
                                    placeholder="e.g. TWW"
                                    required
                                    className="bg-black/50 border-wow-gold/30 text-wow-light"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newOrder" className="text-wow-gold">Order</Label>
                                  <Input
                                    id="newOrder"
                                    name="order"
                                    type="number"
                                    defaultValue="100"
                                    required
                                    className="bg-black/50 border-wow-gold/30 text-wow-light"
                                  />
                                  <p className="text-xs text-wow-light">Higher numbers appear first</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="newIsActive" 
                                    name="isActive"
                                  />
                                  <Label htmlFor="newIsActive" className="text-wow-gold">Active Expansion</Label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  type="submit" 
                                  className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                  disabled={createExpansionMutation.isPending}
                                >
                                  {createExpansionMutation.isPending ? 'Creating...' : 'Create Expansion'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                {/* Raid Tiers Management */}
                <Card className="bg-black/50 border-wow-gold/20 shadow-lg lg:col-span-2">
                  <CardHeader className="pb-2 bg-gradient-to-r from-green-900/30 to-green-800/10">
                    <CardTitle className="text-wow-gold text-xl flex items-center">
                      <Trophy className="h-6 w-6 mr-2 text-yellow-400" />
                      Raid Tiers
                    </CardTitle>
                    <CardDescription className="text-wow-light">
                      {selectedExpansionId 
                        ? `Manage raid tiers for ${expansionsData?.expansions?.find(e => e.id === selectedExpansionId)?.name}` 
                        : "Select an expansion to view and manage raid tiers"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    {isLoadingRaidTiers ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-8 w-8 animate-spin text-wow-gold/60" />
                      </div>
                    ) : !selectedExpansionId ? (
                      <div className="text-center py-8 text-wow-light">
                        <GanttChart className="h-12 w-12 mx-auto mb-4 text-wow-gold/40" />
                        <h3 className="text-wow-gold text-lg mb-2">No Expansion Selected</h3>
                        <p>Please select an expansion from the left panel to view and manage its raid tiers</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {raidTiersData?.tiers?.map((tier) => (
                            <div
                              key={tier.id}
                              className={`p-4 border rounded-lg ${
                                tier.isCurrent 
                                  ? 'bg-wow-gold/20 border-wow-gold/50' 
                                  : 'border-wow-gold/20 hover:bg-wow-gold/10'
                              }`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="text-wow-gold font-medium">{tier.name}</h3>
                                  <p className="text-wow-light text-sm">{tier.shortName}</p>
                                </div>
                                <div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4 text-wow-light" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-black/95 border-wow-gold/20 text-wow-light">
                                      <Dialog>
                                        <DialogTrigger asChild>
                                          <DropdownMenuItem 
                                            className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                            onSelect={(e) => e.preventDefault()}
                                          >
                                            <Edit className="mr-2 h-4 w-4" /> 
                                            <span>Edit</span>
                                          </DropdownMenuItem>
                                        </DialogTrigger>
                                        <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                                          <DialogHeader>
                                            <DialogTitle className="text-wow-gold text-xl">Edit Raid Tier</DialogTitle>
                                          </DialogHeader>
                                          <form
                                            onSubmit={(e) => {
                                              e.preventDefault();
                                              const formData = new FormData(e.currentTarget);
                                              const name = formData.get('name') as string;
                                              const shortName = formData.get('shortName') as string;
                                              const order = parseInt(formData.get('order') as string);
                                              const isActive = formData.get('isActive') === 'on';
                                              const isCurrent = formData.get('isCurrent') === 'on';
                                              
                                              updateRaidTierMutation.mutate({
                                                id: tier.id,
                                                tierData: {
                                                  name,
                                                  shortName,
                                                  order,
                                                  isActive,
                                                  isCurrent
                                                }
                                              });
                                            }}
                                          >
                                            <div className="space-y-4 py-4">
                                              <div className="space-y-2">
                                                <Label htmlFor={`name-${tier.id}`} className="text-wow-gold">Name</Label>
                                                <Input
                                                  id={`name-${tier.id}`}
                                                  name="name"
                                                  defaultValue={tier.name}
                                                  required
                                                  className="bg-black/50 border-wow-gold/30 text-wow-light"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor={`shortName-${tier.id}`} className="text-wow-gold">Short Name</Label>
                                                <Input
                                                  id={`shortName-${tier.id}`}
                                                  name="shortName"
                                                  defaultValue={tier.shortName}
                                                  required
                                                  className="bg-black/50 border-wow-gold/30 text-wow-light"
                                                />
                                              </div>
                                              <div className="space-y-2">
                                                <Label htmlFor={`order-${tier.id}`} className="text-wow-gold">Order</Label>
                                                <Input
                                                  id={`order-${tier.id}`}
                                                  name="order"
                                                  type="number"
                                                  defaultValue={tier.order}
                                                  required
                                                  className="bg-black/50 border-wow-gold/30 text-wow-light"
                                                />
                                                <p className="text-xs text-wow-light">Higher numbers appear first</p>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                  id={`isActive-${tier.id}`} 
                                                  name="isActive"
                                                  defaultChecked={tier.isActive}
                                                />
                                                <Label htmlFor={`isActive-${tier.id}`} className="text-wow-gold">Active Tier</Label>
                                              </div>
                                              <div className="flex items-center space-x-2">
                                                <Checkbox 
                                                  id={`isCurrent-${tier.id}`} 
                                                  name="isCurrent"
                                                  defaultChecked={tier.isCurrent}
                                                />
                                                <Label htmlFor={`isCurrent-${tier.id}`} className="text-wow-gold">Current Tier</Label>
                                              </div>
                                            </div>
                                            <DialogFooter>
                                              <Button 
                                                type="submit" 
                                                className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                              >
                                                Save Changes
                                              </Button>
                                            </DialogFooter>
                                          </form>
                                        </DialogContent>
                                      </Dialog>
                                      {!tier.isCurrent && (
                                        <DropdownMenuItem 
                                          className="cursor-pointer hover:bg-green-900/20 hover:text-wow-gold"
                                          onClick={() => {
                                            updateRaidTierMutation.mutate({
                                              id: tier.id,
                                              tierData: { isCurrent: true }
                                            });
                                          }}
                                        >
                                          <Star className="mr-2 h-4 w-4" /> 
                                          <span>Set as Current Tier</span>
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {tier.isCurrent && (
                                  <Badge className="bg-yellow-900/30 text-yellow-400 border-yellow-500/30">
                                    <Star className="h-3 w-3 mr-1" /> Current
                                  </Badge>
                                )}
                                {tier.isActive ? (
                                  <Badge className="bg-green-900/30 text-green-400 border-green-500/30">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-wow-light">
                                    Inactive
                                  </Badge>
                                )}
                              </div>
                              <Separator className="bg-wow-gold/20 my-2" />
                              <div className="text-wow-light text-sm">
                                <p>Order: {tier.order}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              className="w-full mt-4 bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                              disabled={!selectedExpansionId}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Add Raid Tier
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                            <DialogHeader>
                              <DialogTitle className="text-wow-gold text-xl">Add New Raid Tier</DialogTitle>
                              <DialogDescription className="text-wow-light">
                                Create a new raid tier for {expansionsData?.expansions?.find(e => e.id === selectedExpansionId)?.name}
                              </DialogDescription>
                            </DialogHeader>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const name = formData.get('name') as string;
                                const shortName = formData.get('shortName') as string;
                                const order = parseInt(formData.get('order') as string);
                                const isActive = formData.get('isActive') === 'on';
                                const isCurrent = formData.get('isCurrent') === 'on';
                                
                                // Format the date as an ISO string for proper handling
                                const releaseDate = new Date().toISOString();
                                
                                createRaidTierMutation.mutate({
                                  name,
                                  shortName,
                                  expansionId: selectedExpansionId!,
                                  order,
                                  isActive,
                                  isCurrent,
                                  releaseDate
                                });
                              }}
                            >
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="newTierName" className="text-wow-gold">Name</Label>
                                  <Input
                                    id="newTierName"
                                    name="name"
                                    placeholder="e.g. Liberation of Undermine"
                                    required
                                    className="bg-black/50 border-wow-gold/30 text-wow-light"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newTierShortName" className="text-wow-gold">Short Name</Label>
                                  <Input
                                    id="newTierShortName"
                                    name="shortName"
                                    placeholder="e.g. LOU"
                                    required
                                    className="bg-black/50 border-wow-gold/30 text-wow-light"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="newTierOrder" className="text-wow-gold">Order</Label>
                                  <Input
                                    id="newTierOrder"
                                    name="order"
                                    type="number"
                                    defaultValue="100"
                                    required
                                    className="bg-black/50 border-wow-gold/30 text-wow-light"
                                  />
                                  <p className="text-xs text-wow-light">Higher numbers appear first</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="newTierIsActive" 
                                    name="isActive"
                                    defaultChecked
                                  />
                                  <Label htmlFor="newTierIsActive" className="text-wow-gold">Active Tier</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="newTierIsCurrent" 
                                    name="isCurrent"
                                  />
                                  <Label htmlFor="newTierIsCurrent" className="text-wow-gold">Current Tier</Label>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button 
                                  type="submit" 
                                  className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50"
                                  disabled={createRaidTierMutation.isPending}
                                >
                                  {createRaidTierMutation.isPending ? 'Creating...' : 'Create Raid Tier'}
                                </Button>
                              </DialogFooter>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-6">
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold">Admin Users</CardTitle>
                  <CardDescription className="text-wow-light">Manage admin users who can access this dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50 shadow-md"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Admin User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-black/95 border-wow-gold/30 text-wow-light">
                        <DialogHeader>
                          <DialogTitle className="text-wow-gold text-xl">Add Admin User</DialogTitle>
                          <DialogDescription className="text-wow-light">
                            Create a new admin user with access to the admin panel.
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            const username = formData.get('username') as string;
                            const password = formData.get('password') as string;
                            
                            if (password.length < 8) {
                              toast({
                                title: "Error",
                                description: "Password must be at least 8 characters",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            createAdminUserMutation.mutate({ username, password });
                          }}
                        >
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="username" className="text-wow-gold">Username</Label>
                              <Input
                                id="username"
                                name="username"
                                placeholder="Enter username"
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
                                placeholder="Enter password"
                                required
                                className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="confirm-password" className="text-wow-gold">Confirm Password</Label>
                              <Input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                placeholder="Confirm password"
                                required
                                className="bg-black/50 border-wow-gold/30 text-wow-light focus:border-wow-gold focus:ring-wow-gold/20"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button 
                              type="submit" 
                              className="bg-green-900 hover:bg-green-800 text-wow-light border border-green-700/50 shadow-md"
                              disabled={createAdminUserMutation.isPending}
                            >
                              {createAdminUserMutation.isPending ? 'Creating...' : 'Create User'}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  {isLoadingAdminUsers ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-12 w-full bg-green-900/10" />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-black/30 rounded-lg overflow-hidden border border-wow-gold/10">
                      <Table>
                        <TableHeader className="bg-black/70">
                          <TableRow className="hover:bg-transparent border-b border-wow-gold/20">
                            <TableHead className="text-wow-gold font-semibold">Username</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Role</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Created At</TableHead>
                            <TableHead className="text-wow-gold font-semibold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {adminUsers.map((user) => (
                            <TableRow 
                              key={user.id}
                              className="hover:bg-green-900/10 border-b border-wow-gold/10"
                            >
                              <TableCell className="font-medium text-wow-gold">
                                {user.username}
                              </TableCell>
                              <TableCell>
                                {user.isOwner ? (
                                  <Badge className="bg-amber-900/60 text-amber-300 border-amber-700/70">Owner</Badge>
                                ) : (
                                  <Badge className="bg-green-900/60 text-green-300 border-green-700/70">Admin</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-wow-light">
                                {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : 'N/A'}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-wow-light hover:text-wow-gold hover:bg-black/30"
                                    disabled={user.isOwner}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-red-400/60 hover:text-red-400 hover:bg-red-900/20"
                                        disabled={user.isOwner}
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-black/95 border-wow-gold/20 text-wow-light">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="text-wow-gold">Delete Admin User</AlertDialogTitle>
                                        <AlertDialogDescription className="text-wow-light">
                                          Are you sure you want to delete the admin user "{user.username}"? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="bg-transparent border-wow-gold/20 text-wow-light hover:bg-black/40 hover:text-wow-light">Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          className="bg-red-900 hover:bg-red-800 text-wow-light border border-red-700/50"
                                          onClick={() => deleteAdminUserMutation.mutate(user.id)}
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold">API Settings</CardTitle>
                  <CardDescription className="text-wow-light">Configure external API connections</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-wow-gold">Raider.IO API</Label>
                        <Badge className="bg-green-900/60 text-green-300 border-green-700/70">Connected</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          type="password"
                          value="••••••••••••••••••••••••"
                          disabled
                          className="bg-black/50 border-wow-gold/20 text-wow-light flex-1"
                        />
                        <Button 
                          variant="outline" 
                          className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-wow-gold">Blizzard API</Label>
                        <Badge className="bg-green-900/60 text-green-300 border-green-700/70">Connected</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1">
                          <Label className="text-sm text-wow-light">Client ID</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value="••••••••••••••••••••••••"
                              disabled
                              className="bg-black/50 border-wow-gold/20 text-wow-light flex-1"
                            />
                            <Button 
                              variant="outline" 
                              className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-wow-light">Client Secret</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value="••••••••••••••••••••••••"
                              disabled
                              className="bg-black/50 border-wow-gold/20 text-wow-light flex-1"
                            />
                            <Button 
                              variant="outline" 
                              className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-wow-gold">Warcraftlogs API</Label>
                        <Badge className="bg-green-900/60 text-green-300 border-green-700/70">Connected</Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="space-y-1">
                          <Label className="text-sm text-wow-light">Client ID</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value="••••••••••••••••••••••••"
                              disabled
                              className="bg-black/50 border-wow-gold/20 text-wow-light flex-1"
                            />
                            <Button 
                              variant="outline" 
                              className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-sm text-wow-light">Client Secret</Label>
                          <div className="flex gap-2">
                            <Input
                              type="password"
                              value="••••••••••••••••••••••••"
                              disabled
                              className="bg-black/50 border-wow-gold/20 text-wow-light flex-1"
                            />
                            <Button 
                              variant="outline" 
                              className="bg-black/50 border-wow-gold/20 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                            >
                              Update
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/50 border-wow-gold/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-wow-gold">General Settings</CardTitle>
                  <CardDescription className="text-wow-light">Configure dashboard behavior</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-wow-gold">Daily Refresh</Label>
                        <p className="text-sm text-wow-light">Automatically refresh data every day</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Switch checked={true} onCheckedChange={(checked) => {
                          handleSettingUpdate(
                            'daily_refresh', 
                            checked ? 'true' : 'false', 
                            `Daily refresh ${checked ? 'enabled' : 'disabled'}`
                          );
                        }} />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                          onClick={() => {
                            // Open a dialog to edit the setting
                            toast({
                              title: "Setting Toggled",
                              description: "Daily refresh setting updated",
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="bg-wow-gold/20" />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-wow-gold">Auto-update Members</Label>
                        <p className="text-sm text-wow-light">Automatically update guild members when roster changes</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Switch checked={true} onCheckedChange={(checked) => {
                          handleSettingUpdate(
                            'auto_update_members', 
                            checked ? 'true' : 'false', 
                            `Auto-update members ${checked ? 'enabled' : 'disabled'}`
                          );
                        }} />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                          onClick={() => {
                            // Open a dialog to edit the setting
                            toast({
                              title: "Setting Toggled",
                              description: "Auto-update members setting updated",
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="bg-wow-gold/20" />
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-wow-gold">Dark Theme</Label>
                        <p className="text-sm text-wow-light">Use dark theme for the admin interface</p>
                      </div>
                      <div className="flex gap-2 items-center">
                        <Switch checked={true} onCheckedChange={(checked) => {
                          handleSettingUpdate(
                            'dark_theme', 
                            checked ? 'true' : 'false', 
                            `Dark theme ${checked ? 'enabled' : 'disabled'}`
                          );
                        }} />
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                          onClick={() => {
                            // Open a dialog to edit the setting
                            toast({
                              title: "Setting Toggled",
                              description: "Dark theme setting updated",
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="bg-wow-gold/20" />
                    
                    <div className="flex items-start justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-wow-gold">Default Raid Difficulty</Label>
                        <p className="text-sm text-wow-light">Default difficulty to display on raid progress</p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <Select 
                          defaultValue="mythic"
                          onValueChange={(value) => {
                            toast({
                              title: "Setting Updated",
                              description: `Default raid difficulty set to ${value}`,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-black/50 border-wow-gold/20 text-wow-light w-[100px]">
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                          <SelectContent className="bg-black/90 border-wow-gold/20 text-wow-light">
                            <SelectItem value="mythic">Mythic</SelectItem>
                            <SelectItem value="heroic">Heroic</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-wow-light hover:bg-green-900/30 hover:text-wow-gold"
                          onClick={() => {
                            toast({
                              title: "Edit Setting",
                              description: "Default raid difficulty updated",
                            });
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}