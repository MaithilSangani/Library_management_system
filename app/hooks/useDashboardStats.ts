'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface DashboardStats {
  overview: {
    totalPatrons: number;
    totalItems: number;
    activeTransactions: number;
    availableItems: number;
    utilizationRate: number;
  };
  patrons: {
    total: number;
    students: number;
    faculty: number;
    general: number;
    newToday: number;
  };
  transactions: {
    active: number;
    overdue: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  reservations: {
    active: number;
    today: number;
  };
  finances: {
    totalFinesOwed: number;
    finesPaidToday: number;
    estimatedOverdueAmount: number;
  };
  recentActivity: {
    transactions: Array<{
      id: number;
      patronName: string;
      itemTitle: string;
      itemAuthor: string;
      borrowedAt: string;
      dueDate: string;
      isOverdue: boolean;
    }>;
    registrations: Array<{
      id: number;
      name: string;
      email: string;
      userType: string;
      createdAt: string;
    }>;
  };
  trends: {
    daily: Array<{
      date: string;
      transactions: number;
    }>;
    weekly: Array<{
      week: string;
      transactions: number;
    }>;
  };
  alerts: {
    overdueBooks: number;
    lowStock: number;
    pendingReturns: number;
  };
  lastUpdated: string;
  refreshInterval: number;
}

export interface UseDashboardStatsOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  onError?: (error: string) => void;
  onUpdate?: (stats: DashboardStats) => void;
}

export interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  lastRefresh: Date | null;
  refetch: () => Promise<void>;
  toggleAutoRefresh: () => void;
  setRefreshInterval: (interval: number) => void;
  autoRefresh: boolean;
}

export function useDashboardStats(options: UseDashboardStatsOptions = {}): UseDashboardStatsReturn {
  const {
    autoRefresh: initialAutoRefresh = false,
    refreshInterval: initialRefreshInterval = 30000,
    onError,
    onUpdate
  } = options;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);
  const [refreshInterval, setRefreshIntervalState] = useState(initialRefreshInterval);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchStats = useCallback(async (showToast = false) => {
    try {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);
      setIsConnected(true);

      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch dashboard statistics');
      }

      const newStats = result.data;
      setStats(newStats);
      setLastRefresh(new Date());
      
      if (showToast) {
        toast.success('Dashboard updated successfully');
      }

      // Call update callback if provided
      if (onUpdate) {
        onUpdate(newStats);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return; // Request was cancelled, don't treat as error
      }

      setIsConnected(false);
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch dashboard statistics';
      setError(errorMessage);

      if (onError) {
        onError(errorMessage);
      }

      console.error('Dashboard stats fetch error:', err);
      
      toast.error('Failed to update dashboard statistics');
      
    } finally {
      setLoading(false);
    }
  }, [onError, onUpdate]);

  const refetch = useCallback(async () => {
    await fetchStats(true);
  }, [fetchStats]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);

  const setRefreshInterval = useCallback((interval: number) => {
    setRefreshIntervalState(interval);
  }, []);

  // Handle auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchStats();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [autoRefresh, refreshInterval, fetchStats]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    
    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchStats]);

  // Handle visibility change (pause/resume auto-refresh when tab is hidden/visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, pause auto-refresh
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (autoRefresh && refreshInterval > 0) {
        // Tab is visible, resume auto-refresh
        fetchStats(); // Immediate refresh when coming back
        intervalRef.current = setInterval(() => {
          fetchStats();
        }, refreshInterval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoRefresh, refreshInterval, fetchStats]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      if (autoRefresh) {
        fetchStats(); // Refresh when coming back online
      }
    };

    const handleOffline = () => {
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoRefresh, fetchStats]);

  return {
    stats,
    loading,
    error,
    isConnected,
    lastRefresh,
    refetch,
    toggleAutoRefresh,
    setRefreshInterval,
    autoRefresh
  };
}

// Utility hook for specific dashboard metrics
export function useDashboardMetric<T>(
  stats: DashboardStats | null,
  selector: (stats: DashboardStats) => T
): T | null {
  return stats ? selector(stats) : null;
}

// Pre-defined metric selectors
export const dashboardMetrics = {
  totalPatrons: (stats: DashboardStats) => stats.overview.totalPatrons,
  overdueBooks: (stats: DashboardStats) => stats.transactions.overdue,
  activeTransactions: (stats: DashboardStats) => stats.transactions.active,
  utilizationRate: (stats: DashboardStats) => stats.overview.utilizationRate,
  todayTransactions: (stats: DashboardStats) => stats.transactions.today,
  newPatronsToday: (stats: DashboardStats) => stats.patrons.newToday,
  totalFines: (stats: DashboardStats) => stats.finances.totalFinesOwed
};
