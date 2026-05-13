import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface LibrarySettings {
  librarySettingsId: number;
  borrowingLimit: number;
  loanPeriodDays: number;
  finePerDay: number;
  updatedAt: string;
  updatedByAdminId: number | null;
  updatedBy: {
    id: number;
    name: string;
    email: string;
  } | null;
}

interface SystemStats {
  totalUsers: number;
  totalItems: number;
  totalTransactions: number;
  overdueTransactions: number;
  pendingRequests: number;
  totalFinesCollected: number;
}

interface UpdateSettingsData {
  borrowingLimit: number;
  loanPeriodDays: number;
  finePerDay: number;
  updatedByAdminId?: number;
}

interface SystemConfigState {
  settings: LibrarySettings | null;
  stats: SystemStats | null;
  loading: boolean;
  statsLoading: boolean;
  error: string | null;
}

export function useSystemConfig() {
  const [state, setState] = useState<SystemConfigState>({
    settings: null,
    stats: null,
    loading: true,
    statsLoading: true,
    error: null,
  });

  // Fetch library settings
  const fetchSettings = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/admin/system-config');
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          settings: data.settings,
          loading: false,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      toast.error(errorMessage);
    }
  };

  // Fetch system statistics
  const fetchSystemStats = async () => {
    try {
      setState(prev => ({ ...prev, statsLoading: true }));
      
      const response = await fetch('/api/admin/system-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getSystemStats' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          stats: data.stats,
          statsLoading: false,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch system stats');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system stats';
      setState(prev => ({
        ...prev,
        statsLoading: false,
      }));
      console.error('System stats error:', errorMessage);
    }
  };

  // Update library settings
  const updateSettings = async (settingsData: UpdateSettingsData): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/system-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settingsData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          settings: data.settings
        }));
        toast.success(data.message || 'Settings updated successfully');
        return true;
      } else {
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
      toast.error(errorMessage);
      return false;
    }
  };

  // Validate settings input
  const validateSettings = (settings: UpdateSettingsData): string | null => {
    if (!Number.isInteger(settings.borrowingLimit) || settings.borrowingLimit < 1 || settings.borrowingLimit > 50) {
      return 'Borrowing limit must be an integer between 1 and 50';
    }

    if (!Number.isInteger(settings.loanPeriodDays) || settings.loanPeriodDays < 1 || settings.loanPeriodDays > 365) {
      return 'Loan period must be an integer between 1 and 365 days';
    }

    if (typeof settings.finePerDay !== 'number' || settings.finePerDay < 0 || settings.finePerDay > 1000) {
      return 'Fine per day must be a number between 0 and 1000';
    }

    return null;
  };

  // Reset to default settings
  const resetToDefaults = async (updatedByAdminId?: number): Promise<boolean> => {
    const defaultSettings = {
      borrowingLimit: 5,
      loanPeriodDays: 14,
      finePerDay: 1.0,
      updatedByAdminId
    };

    return await updateSettings(defaultSettings);
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get time ago string
  const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} ago`;
    } else {
      return formatDate(dateString);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchSettings();
    fetchSystemStats();
  }, []);

  // Auto-refresh stats every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSystemStats();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    fetchSettings,
    fetchSystemStats,
    updateSettings,
    validateSettings,
    resetToDefaults,
    formatCurrency,
    formatDate,
    getTimeAgo,
  };
}

export type { LibrarySettings, SystemStats, UpdateSettingsData };
