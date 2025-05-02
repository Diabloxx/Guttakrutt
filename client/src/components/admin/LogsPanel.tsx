import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 as Loader2Icon } from 'lucide-react';
import { Filter as FilterIcon } from 'lucide-react';
import { Trash as TrashIcon } from 'lucide-react';
import { RefreshCw } from 'lucide-react';
import { Search as SearchIcon } from 'lucide-react';
import { X as XIcon } from 'lucide-react';
import { SlidersHorizontal } from 'lucide-react';
import { Shield } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Clock } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface WebLog {
  id: number;
  operation: string;
  status: string;
  details: string;
  timestamp: string;
  userId?: number;
  duration?: number;
  ipAddress?: string;
  userAgent?: string;
}

interface LogsResponse {
  success: boolean;
  logs: WebLog[];
  totalCount: number;
  limit: number;
  offset: number;
  currentPage: number;
  totalPages: number;
}

interface LogsPanelProps {
  logs?: WebLog[];
  filterType?: string;
  hideHeader?: boolean;
}

export default function LogsPanel({ logs = [], filterType = 'all', hideHeader = false }: LogsPanelProps = {}) {
  const { toast } = useToast();
  const [limit, setLimit] = useState<number>(20);
  const [offset, setOffset] = useState<number>(0);
  const [operationFilter, setOperationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [apiTypeFilter, setApiTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateStart, setDateStart] = useState<Date | undefined>(undefined);
  const [dateEnd, setDateEnd] = useState<Date | undefined>(undefined);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [operations, setOperations] = useState<string[]>([]);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [apiTypes, setApiTypes] = useState<string[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState<boolean>(true);
  
  // Setup polling interval for live updates (every 15 seconds)
  const POLLING_INTERVAL = 15000;

  // Extract API endpoint type from log details
  const extractApiEndpoint = (details: string): string => {
    // Try to match API endpoints in the format GET /api/xyz or POST /api/xyz
    const apiEndpointMatch = details.match(/(GET|POST|PUT|DELETE|PATCH)\s+(\/api\/[^\s\?]+)/i);
    if (apiEndpointMatch && apiEndpointMatch[2]) {
      return apiEndpointMatch[2];
    }
    return '';
  };

  // Fetch logs with filters
  const {
    data: logsData,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useQuery<LogsResponse>({
    queryKey: ['logs', limit, offset, operationFilter, statusFilter, apiTypeFilter, dateStart, dateEnd, isAutoRefreshing],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append('limit', limit.toString());
        params.append('offset', offset.toString());
        
        if (operationFilter && operationFilter !== 'all') {
          params.append('operation', operationFilter);
        }
        
        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter);
        }
        
        // Send date filters if present
        if (dateStart) {
          params.append('dateStart', dateStart.toISOString());
        }
        
        if (dateEnd) {
          params.append('dateEnd', dateEnd.toISOString());
        }
        
        console.log('Fetching logs with params:', params.toString());
        const response = await apiRequest('GET', `/api/admin/logs?${params.toString()}`);
        const data = await response.json();
        console.log('Received logs data:', data);
        return data;
      } catch (error) {
        console.error('Error fetching logs:', error);
        throw error;
      }
    },
    // Enable automatic polling for live updates only if enabled
    refetchInterval: isAutoRefreshing ? POLLING_INTERVAL : false
  });
  
  // Extract unique operations, statuses, and API endpoints for filtering
  useEffect(() => {
    if (logsData?.logs) {
      const uniqueOperations = Array.from(new Set(logsData.logs.map(log => log.operation)));
      const uniqueStatuses = Array.from(new Set(logsData.logs.map(log => log.status)));
      
      // Extract API endpoints from log details
      const apiEndpoints = logsData.logs
        .map(log => extractApiEndpoint(log.details || ''))
        .filter(endpoint => endpoint !== '');
      
      const uniqueApiTypes = Array.from(new Set(apiEndpoints)).sort();
      
      setOperations(uniqueOperations);
      setStatuses(uniqueStatuses);
      setApiTypes(uniqueApiTypes);
      setLastUpdateTime(new Date());
    }
  }, [logsData]);
  
  // Format for the "last updated" text
  const getLastUpdatedText = () => {
    return `Last updated: ${lastUpdateTime.toLocaleTimeString()}`;
  }
  
  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setIsAutoRefreshing(prev => !prev);
    // Force a refetch if turning on auto-refresh
    if (!isAutoRefreshing) {
      setTimeout(() => refetch(), 100);
    }
  };
  
  // Generate status badge with appropriate color and WoW styling
  const getStatusBadge = (status: string) => {
    let iconComponent = null;
    let customClass = "";
    
    // Define style based on status
    switch (status) {
      case 'success':
        iconComponent = <div className="w-2 h-2 rounded-full bg-green-300 dark:bg-green-300 mr-1 shadow-glow-green animate-pulse"></div>;
        customClass = "bg-gradient-to-b from-green-500 to-green-700 dark:from-green-600 dark:to-green-800 text-white border-green-400 dark:border-green-500";
        break;
      case 'error':
        iconComponent = <div className="w-2 h-2 rounded-full bg-red-300 dark:bg-red-300 mr-1 shadow-glow-red animate-pulse"></div>;
        customClass = "bg-gradient-to-b from-red-500 to-red-700 dark:from-red-600 dark:to-red-800 text-white border-red-400 dark:border-red-500";
        break;
      case 'warning':
        iconComponent = <div className="w-2 h-2 rounded-full bg-yellow-300 dark:bg-yellow-300 mr-1 shadow-glow-yellow animate-pulse"></div>;
        customClass = "bg-gradient-to-b from-yellow-400 to-yellow-600 dark:from-yellow-500 dark:to-yellow-700 text-black dark:text-white border-yellow-300 dark:border-yellow-400";
        break;
      case 'info':
        iconComponent = <div className="w-2 h-2 rounded-full bg-blue-300 dark:bg-blue-300 mr-1 shadow-glow-blue animate-pulse"></div>;
        customClass = "bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700 text-white border-blue-300 dark:border-blue-400";
        break;
      default:
        iconComponent = <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-300 mr-1"></div>;
        customClass = "bg-gradient-to-b from-slate-400 to-slate-600 dark:from-slate-500 dark:to-slate-700 text-white border-slate-300 dark:border-slate-400";
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium capitalize shadow-md border ${customClass}`}>
        {iconComponent}
        {status}
      </span>
    );
  };
  
  // Format timestamp
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };
  
  // Reset filters
  const resetFilters = () => {
    setOperationFilter('all');
    setStatusFilter('all');
    setApiTypeFilter('all');
    setSearchTerm('');
    setDateStart(undefined);
    setDateEnd(undefined);
    setShowAdvancedFilters(false);
    setTimeout(() => refetch(), 100);
  };
  
  // Clean up old logs
  const cleanupLogs = async (days: number) => {
    try {
      const response = await apiRequest('DELETE', `/api/admin/logs/cleanup?days=${days}`);
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Logs cleanup",
          description: data.message,
          variant: "default",
        });
        refetch();
      } else {
        throw new Error(data.message || "Failed to clean up logs");
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to clean up logs";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  // For client-side filtering of already loaded logs
  // This is useful for the search term which is not sent to the server
  const filteredLogs = logsData?.logs.filter(log => {
    // Apply search term filter (only client-side)
    const matchesSearch = !searchTerm || 
      (log.details?.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (log.operation?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // The API type filter is also client-side
    const logApiEndpoint = extractApiEndpoint(log.details || '');
    const matchesApiType = apiTypeFilter === 'all' || logApiEndpoint === apiTypeFilter;
    
    // Note: operation, status, and date filters are applied server-side
    // We still include them here for any real-time filtering
    return matchesSearch && matchesApiType;
  }) || [];
  
  // Use server-side pagination values
  const totalLogs = logsData?.totalCount || 0;
  const totalPages = logsData?.totalPages || 1;
  const currentPage = logsData?.currentPage || 1;
  
  // Generate page numbers
  const getPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      // Show all pages if there are fewer than maxPagesToShow
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always include the first page
      pages.push(1);
      
      // Calculate range around current page
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust to show maxPagesToShow-2 pages (excluding first and last)
      while (end - start + 1 < maxPagesToShow - 2 && end < totalPages - 1) {
        end++;
      }
      while (end - start + 1 < maxPagesToShow - 2 && start > 2) {
        start--;
      }
      
      // Add ellipsis after first page if needed
      if (start > 2) {
        pages.push(null); // null represents ellipsis
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis before last page if needed
      if (end < totalPages - 1) {
        pages.push(null);
      }
      
      // Always include the last page
      pages.push(totalPages);
    }
    
    return pages;
  };
  
  const goToPage = (page: number) => {
    setOffset((page - 1) * limit);
    // Force a refetch with the new page offset
    setTimeout(() => refetch(), 100);
  };
  
  return (
    <div className="space-y-4">
      {!hideHeader && (
        <div className="flex items-center justify-between bg-white/90 dark:bg-black/70 p-4 rounded-md shadow-md border border-slate-200 dark:border-wow-gold/20">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-wow-gold">System Logs</h2>
          <div className="flex items-center space-x-3">
            <Button onClick={() => refetch()} variant="outline" size="sm" className="bg-white dark:bg-black/80 text-slate-800 dark:text-wow-light border-slate-300 dark:border-wow-gold/30 hover:bg-slate-100 dark:hover:bg-black">
              <RefreshCw className="w-4 h-4 mr-2 text-green-600 dark:text-wow-gold" />
              <span className="font-medium">Refresh Logs</span>
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="bg-red-600 dark:bg-red-700/90 text-white border-red-500 dark:border-red-600 hover:bg-red-700 dark:hover:bg-red-800">
                  <TrashIcon className="w-4 h-4 mr-2" />
                  <span className="font-medium">Cleanup Old Logs</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete logs older than 90 days.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cleanupLogs(90)}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}
      
      <div className="bg-slate-100 dark:bg-black/50 p-4 rounded-md shadow-sm border border-slate-200 dark:border-wow-gold/20">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-wow-gold">Search</label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 dark:text-wow-gold/70 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by operation or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light placeholder:text-slate-500 dark:placeholder:text-wow-light/50"
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-500 dark:text-wow-light/70"
                    onClick={() => setSearchTerm('')}
                  >
                    <XIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {searchTerm && (
                <p className="text-xs text-slate-600 dark:text-wow-light/80 mt-1">
                  Searching for "{searchTerm}"
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-wow-gold">Operation</label>
              <Select 
                value={operationFilter} 
                onValueChange={(value) => {
                  setOperationFilter(value);
                  // Force a refetch with the new filter
                  setTimeout(() => refetch(), 100);
                }}
              >
                <SelectTrigger className="w-[180px] bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light">
                  <SelectValue placeholder="Select operation" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-black/95 border dark:border-wow-gold/30">
                  <SelectItem value="all" className="text-slate-800 dark:text-wow-light">All Operations</SelectItem>
                  {operations.map((op) => (
                    <SelectItem key={op} value={op} className="text-slate-800 dark:text-wow-light">
                      {op.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-wow-gold">Status</label>
              <Select 
                value={statusFilter} 
                onValueChange={(value) => {
                  setStatusFilter(value);
                  // Force a refetch with the new filter
                  setTimeout(() => refetch(), 100);
                }}
              >
                <SelectTrigger className="w-[180px] bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-black/95 border dark:border-wow-gold/30">
                  <SelectItem value="all" className="text-slate-800 dark:text-wow-light">All Statuses</SelectItem>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status} className="text-slate-800 dark:text-wow-light capitalize">
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* API Endpoint filter */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-700 dark:text-wow-gold">API Endpoint</label>
              <Select 
                value={apiTypeFilter} 
                onValueChange={(value) => {
                  setApiTypeFilter(value);
                  // Force a refetch with the new filter
                  setTimeout(() => refetch(), 100);
                }}
              >
                <SelectTrigger className="w-[200px] bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light">
                  <SelectValue placeholder="Select API endpoint" />
                </SelectTrigger>
                <SelectContent className="bg-white/95 dark:bg-black/95 border dark:border-wow-gold/30">
                  <SelectItem value="all" className="text-slate-800 dark:text-wow-light">All Endpoints</SelectItem>
                  {apiTypes.map((endpoint) => (
                    <SelectItem key={endpoint} value={endpoint} className="text-slate-800 dark:text-wow-light">
                      {endpoint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end mt-auto">
              <Button 
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                variant="outline"
                size="sm"
                className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light hover:bg-slate-100 dark:hover:bg-black/90"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2 text-slate-600 dark:text-wow-gold" />
                {showAdvancedFilters ? "Hide Advanced Filters" : "Show Advanced Filters"}
              </Button>
            </div>
            
            <div className="flex items-end mt-auto">
              <Button 
                onClick={resetFilters} 
                variant={operationFilter !== 'all' || statusFilter !== 'all' || apiTypeFilter !== 'all' || searchTerm || dateStart || dateEnd ? "default" : "outline"}
                size="sm"
                className={`
                  relative
                  ${operationFilter !== 'all' || statusFilter !== 'all' || apiTypeFilter !== 'all' || searchTerm || dateStart || dateEnd
                    ? 'bg-green-600 dark:bg-wow-gold hover:bg-green-700 dark:hover:bg-wow-gold/90 text-white dark:text-black border-green-500 dark:border-wow-gold/80' 
                    : 'bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light hover:bg-slate-100 dark:hover:bg-black/90'}
                `}
              >
                <FilterIcon className={`w-4 h-4 mr-2 ${operationFilter !== 'all' || statusFilter !== 'all' || apiTypeFilter !== 'all' || searchTerm || dateStart || dateEnd ? 'text-white dark:text-black' : ''}`} />
                Reset Filters
                {(operationFilter !== 'all' || statusFilter !== 'all' || apiTypeFilter !== 'all' || searchTerm || dateStart || dateEnd) && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white dark:bg-black text-green-600 dark:text-wow-gold font-medium">
                    {(operationFilter !== 'all' ? 1 : 0) + 
                     (statusFilter !== 'all' ? 1 : 0) + 
                     (apiTypeFilter !== 'all' ? 1 : 0) + 
                     (searchTerm ? 1 : 0) + 
                     (dateStart ? 1 : 0) + 
                     (dateEnd ? 1 : 0)}
                  </span>
                )}
              </Button>
            </div>
          </div>
          
          {/* Quick Filter Presets */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light hover:bg-slate-100 dark:hover:bg-black/90"
              onClick={() => {
                setOperationFilter('api_request');
                setStatusFilter('error');
                setTimeout(() => refetch(), 100);
              }}
            >
              <AlertCircle className="w-4 h-4 mr-1 text-red-500" />
              API Errors
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light hover:bg-slate-100 dark:hover:bg-black/90"
              onClick={() => {
                setStatusFilter('all');
                setOperationFilter('admin_action');
                setTimeout(() => refetch(), 100);
              }}
            >
              <Shield className="w-4 h-4 mr-1 text-blue-500" />
              Admin Actions
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light hover:bg-slate-100 dark:hover:bg-black/90"
              onClick={() => {
                setApiTypeFilter('/api/admin/refresh-data');
                setTimeout(() => refetch(), 100);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-1 text-green-500" />
              Data Refreshes
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light hover:bg-slate-100 dark:hover:bg-black/90"
              onClick={() => {
                // Set filter to today's logs
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                setDateStart(today);
                setShowAdvancedFilters(true);
                setTimeout(() => refetch(), 100);
              }}
            >
              <Clock className="w-4 h-4 mr-1 text-purple-500" />
              Today's Logs
            </Button>
          </div>
          
          {/* Advanced Filters (Date Range, etc.) */}
          {showAdvancedFilters && (
            <div className="mt-4 p-3 bg-white/60 dark:bg-black/40 border border-slate-200 dark:border-wow-gold/20 rounded-md">
              <h3 className="font-medium text-slate-800 dark:text-wow-gold mb-3 text-sm">Advanced Filters</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-wow-gold">Start Date</label>
                  <div className="flex">
                    <Input
                      type="date"
                      value={dateStart?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        setDateStart(date);
                      }}
                      className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light"
                    />
                    {dateStart && (
                      <Button
                        variant="ghost"
                        className="ml-2 px-2 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-500 dark:text-wow-light/70"
                        onClick={() => setDateStart(undefined)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-wow-gold">End Date</label>
                  <div className="flex">
                    <Input
                      type="date"
                      value={dateEnd?.toISOString().split('T')[0] || ''}
                      onChange={(e) => {
                        const date = e.target.value ? new Date(e.target.value) : undefined;
                        if (date) {
                          // Set to end of day
                          date.setHours(23, 59, 59, 999);
                        }
                        setDateEnd(date);
                      }}
                      className="bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light"
                    />
                    {dateEnd && (
                      <Button
                        variant="ghost"
                        className="ml-2 px-2 hover:bg-slate-200 dark:hover:bg-black/50 text-slate-500 dark:text-wow-light/70"
                        onClick={() => setDateEnd(undefined)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-right">
                <Button 
                  onClick={() => {
                    // Apply the date filters
                    setTimeout(() => refetch(), 100);
                  }}
                  className="bg-green-600 dark:bg-wow-gold hover:bg-green-700 dark:hover:bg-wow-gold/90 text-white dark:text-black border-green-500 dark:border-wow-gold/80"
                  size="sm"
                >
                  <FilterIcon className="w-4 h-4 mr-2" />
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
          
          {/* Active Filter Tags */}
          {(operationFilter !== 'all' || statusFilter !== 'all' || apiTypeFilter !== 'all' || searchTerm || dateStart || dateEnd) && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {operationFilter !== 'all' && (
                  <Badge className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white">
                    Operation: {operationFilter.replace(/_/g, ' ')}
                    <XIcon 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setOperationFilter('all');
                        setTimeout(() => refetch(), 100);
                      }}
                    />
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white">
                    Status: {statusFilter}
                    <XIcon 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setStatusFilter('all');
                        setTimeout(() => refetch(), 100);
                      }}
                    />
                  </Badge>
                )}
                {apiTypeFilter !== 'all' && (
                  <Badge className="flex items-center gap-1 bg-purple-500 hover:bg-purple-600 text-white">
                    API: {apiTypeFilter}
                    <XIcon 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        setApiTypeFilter('all');
                        setTimeout(() => refetch(), 100);
                      }}
                    />
                  </Badge>
                )}
                {searchTerm && (
                  <Badge className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white">
                    Search: "{searchTerm}"
                    <XIcon 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSearchTerm('')}
                    />
                  </Badge>
                )}
                {dateStart && (
                  <Badge className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white">
                    From: {dateStart.toLocaleDateString()}
                    <XIcon 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setDateStart(undefined)}
                    />
                  </Badge>
                )}
                {dateEnd && (
                  <Badge className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 text-white">
                    To: {dateEnd.toLocaleDateString()}
                    <XIcon 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setDateEnd(undefined)}
                    />
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64 bg-white/90 dark:bg-black/50 rounded-md border border-slate-200 dark:border-wow-gold/20 shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <Loader2Icon className="w-10 h-10 animate-spin text-green-600 dark:text-wow-gold" />
            <p className="text-slate-700 dark:text-wow-light font-medium">Loading logs...</p>
          </div>
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center h-64 rounded-md border border-red-300 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 shadow-md">
          <div className="text-center py-8 text-red-600 dark:text-red-400 flex flex-col items-center">
            <p className="font-semibold text-lg mb-2">Error loading logs</p>
            <p className="text-slate-700 dark:text-wow-light/80">Please check your connection and try again.</p>
            <Button 
              onClick={() => refetch()} 
              variant="outline" 
              size="sm" 
              className="mt-4 border-red-300 dark:border-red-800/70 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-md border border-slate-200 dark:border-wow-gold/20 overflow-hidden bg-white/90 dark:bg-black/50 shadow-md">
            <Table>
              <TableCaption className="pb-4 text-slate-600 dark:text-wow-light/80">
                System logs showing operations and their status
              </TableCaption>
              <TableHeader className="bg-slate-100 dark:bg-black/70">
                <TableRow className="border-b border-slate-200 dark:border-wow-gold/30">
                  <TableHead className="w-[80px] font-bold text-slate-800 dark:text-wow-gold">ID</TableHead>
                  <TableHead className="font-bold text-slate-800 dark:text-wow-gold">Operation</TableHead>
                  <TableHead className="font-bold text-slate-800 dark:text-wow-gold">Status</TableHead>
                  <TableHead className="max-w-xs font-bold text-slate-800 dark:text-wow-gold">Details</TableHead>
                  <TableHead className="w-[180px] font-bold text-slate-800 dark:text-wow-gold">Timestamp</TableHead>
                  <TableHead className="w-[100px] font-bold text-slate-800 dark:text-wow-gold">User ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <div className="bg-slate-100 dark:bg-black/60 rounded-full p-3 mb-2 border border-slate-200 dark:border-wow-gold/30">
                          <FilterIcon className="w-6 h-6 text-slate-500 dark:text-wow-gold/70" />
                        </div>
                        <p className="text-lg font-medium text-slate-700 dark:text-wow-light">No logs found</p>
                        <p className="text-sm text-slate-600 dark:text-wow-light/80 max-w-md text-center">
                          {searchTerm || operationFilter !== 'all' || statusFilter !== 'all' 
                            ? "Try changing your search criteria or removing filters"
                            : "Logs will appear here when system activities are recorded"}
                        </p>
                        {(searchTerm || operationFilter !== 'all' || statusFilter !== 'all') && (
                          <Button 
                            onClick={resetFilters} 
                            variant="outline" 
                            size="sm" 
                            className="mt-2 bg-white/90 dark:bg-black/70 border-slate-300 dark:border-wow-gold/30 text-slate-800 dark:text-wow-light"
                          >
                            <FilterIcon className="w-4 h-4 mr-2" />
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.slice(0, limit).map((log) => (
                    <TableRow key={log.id} className="hover:bg-slate-50 dark:hover:bg-black/70 border-b border-slate-200 dark:border-slate-700/30">
                      <TableCell className="font-medium text-slate-800 dark:text-wow-gold">{log.id}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 dark:bg-black/60 text-slate-700 dark:text-wow-light border border-slate-200 dark:border-wow-gold/20 text-sm font-medium capitalize">
                          {log.operation.replace(/_/g, ' ')}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-xs truncate text-slate-700 dark:text-wow-light">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block">
                                {log.details || "No details"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-md bg-white/95 dark:bg-black/95 border dark:border-wow-gold/30 text-slate-800 dark:text-wow-light">
                              <p>{log.details || "No details"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-wow-light">{formatDate(log.timestamp)}</TableCell>
                      <TableCell className="text-slate-700 dark:text-wow-light">{log.userId || "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 p-4 bg-white/90 dark:bg-black/50 rounded-md shadow-md border border-slate-200 dark:border-wow-gold/20">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="text-sm text-slate-700 dark:text-wow-light/80">
                Showing <span className="font-medium text-slate-800 dark:text-wow-gold">{Math.min(offset + 1, totalLogs)}</span> to{" "}
                <span className="font-medium text-slate-800 dark:text-wow-gold">{Math.min(offset + limit, totalLogs)}</span> of{" "}
                <span className="font-medium text-slate-800 dark:text-wow-gold">{totalLogs}</span> logs
              </div>
              
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-700 dark:text-wow-light/80 flex items-center gap-2">
                  {isFetching ? (
                    <span className="flex items-center gap-1">
                      <span className="animate-spin w-3 h-3">
                        <RefreshCw className="w-3 h-3 text-green-600 dark:text-wow-gold" />
                      </span>
                      <span className="text-green-600 dark:text-wow-gold font-medium">Updating...</span>
                    </span>
                  ) : (
                    <span>{getLastUpdatedText()}</span>
                  )}
                </span>
                
                <div className="flex items-center space-x-2 border-l pl-4 border-slate-200 dark:border-wow-gold/20">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="auto-refresh"
                            checked={isAutoRefreshing}
                            onCheckedChange={toggleAutoRefresh}
                            className={`
                              data-[state=checked]:bg-green-600 dark:data-[state=checked]:bg-wow-gold/80
                              ${isAutoRefreshing ? 'ring-2 ring-green-400 dark:ring-wow-gold/50 ring-offset-1' : ''}
                            `}
                          />
                          <Label htmlFor="auto-refresh" className={`
                            text-sm font-medium 
                            ${isAutoRefreshing 
                              ? 'text-green-600 dark:text-wow-gold' 
                              : 'text-slate-700 dark:text-wow-light/80'
                            }
                          `}>
                            {isAutoRefreshing ? "Auto-refresh on" : "Auto-refresh off"}
                          </Label>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="bg-white/95 dark:bg-black/95 border dark:border-wow-gold/30 text-slate-800 dark:text-wow-light">
                        {isAutoRefreshing 
                          ? `Logs will auto-refresh every ${POLLING_INTERVAL/1000} seconds` 
                          : "Turn on to automatically refresh logs"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    className={`${currentPage === 1 ? "pointer-events-none opacity-50" : ""} text-slate-700 dark:text-wow-light border-slate-300 dark:border-wow-gold/30 hover:bg-slate-100 dark:hover:bg-black/70`}
                  />
                </PaginationItem>
                
                {getPageNumbers().map((page, i) => (
                  page === null ? (
                    <PaginationItem key={`ellipsis-${i}`}>
                      <PaginationEllipsis className="text-slate-600 dark:text-wow-light/70" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={page === currentPage}
                        onClick={() => goToPage(page)}
                        className={
                          page === currentPage 
                            ? "bg-green-600 dark:bg-wow-gold/80 text-white dark:text-black border-green-500 dark:border-wow-gold" 
                            : "bg-white/90 dark:bg-black/70 text-slate-700 dark:text-wow-light border-slate-300 dark:border-wow-gold/30 hover:bg-slate-100 dark:hover:bg-black/90"
                        }
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : ""} text-slate-700 dark:text-wow-light border-slate-300 dark:border-wow-gold/30 hover:bg-slate-100 dark:hover:bg-black/70`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </>
      )}
    </div>
  );
}