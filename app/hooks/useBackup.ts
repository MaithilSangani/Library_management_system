import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface BackupFile {
  filename: string;
  size: number;
  created: string;
  modified: string;
  sizeFormatted: string;
}

interface DatabaseInfo {
  tables: number;
  totalRecords: number;
  estimatedSize: string;
}

interface BackupInfo {
  count: number;
  totalSize: number;
  totalSizeFormatted: string;
  directory: string;
  maxBackups: number;
}

interface SystemInfo {
  database: DatabaseInfo;
  backups: BackupInfo;
}

interface BackupVerification {
  filename: string;
  size: number;
  sizeFormatted: string;
  created: string;
  isValid: boolean;
  readable: boolean;
}

interface BackupState {
  backups: BackupFile[];
  systemInfo: SystemInfo | null;
  loading: boolean;
  creating: boolean;
  restoring: boolean;
  error: string | null;
}

export function useBackup() {
  const [state, setState] = useState<BackupState>({
    backups: [],
    systemInfo: null,
    loading: true,
    creating: false,
    restoring: false,
    error: null,
  });

  // Fetch list of available backups
  const fetchBackups = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'list' }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          backups: data.backups,
          loading: false,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch backups');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch backups';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      toast.error(errorMessage);
    }
  }, []);

  // Fetch system information
  const fetchSystemInfo = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'info' }),
      });

      const data = await response.json();

      if (data.success) {
        setState(prev => ({
          ...prev,
          systemInfo: data.info,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch system info');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch system info';
      console.error('System info error:', errorMessage);
      // Don't show toast for system info errors as they're not critical
    }
  }, []);

  // Create a new backup
  const createBackup = useCallback(async (customName?: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, creating: true, error: null }));

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          backupName: customName?.trim() || undefined
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Backup created successfully');
        // Refresh backups list and system info
        await Promise.all([fetchBackups(), fetchSystemInfo()]);
        return true;
      } else {
        throw new Error(data.error || 'Failed to create backup');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create backup';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, creating: false }));
    }
  }, [fetchBackups, fetchSystemInfo]);

  // Restore from a backup
  const restoreBackup = useCallback(async (backupFileName: string): Promise<boolean> => {
    if (!backupFileName) {
      toast.error('Backup filename is required');
      return false;
    }

    // Show confirmation dialog
    const confirmed = confirm(
      `⚠️ WARNING: This will replace all current data with the backup data.\n\n` +
      `Backup: ${backupFileName}\n\n` +
      `This action cannot be undone. Are you sure you want to continue?`
    );

    if (!confirmed) {
      return false;
    }

    try {
      setState(prev => ({ ...prev, restoring: true, error: null }));

      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'restore',
          restoreFile: backupFileName
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Database restored successfully');
        // Refresh system info after restore
        await fetchSystemInfo();
        return true;
      } else {
        throw new Error(data.error || 'Failed to restore backup');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to restore backup';
      setState(prev => ({ ...prev, error: errorMessage }));
      toast.error(errorMessage);
      return false;
    } finally {
      setState(prev => ({ ...prev, restoring: false }));
    }
  }, [fetchSystemInfo]);

  // Delete a backup file
  const deleteBackup = useCallback(async (backupFileName: string): Promise<boolean> => {
    if (!backupFileName) {
      toast.error('Backup filename is required');
      return false;
    }

    const confirmed = confirm(`Are you sure you want to delete the backup: ${backupFileName}?`);
    if (!confirmed) {
      return false;
    }

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          backupName: backupFileName
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || 'Backup deleted successfully');
        // Refresh backups list and system info
        await Promise.all([fetchBackups(), fetchSystemInfo()]);
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete backup');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete backup';
      toast.error(errorMessage);
      return false;
    }
  }, [fetchBackups, fetchSystemInfo]);

  // Verify a backup file
  const verifyBackup = useCallback(async (backupFileName: string): Promise<BackupVerification | null> => {
    if (!backupFileName) {
      toast.error('Backup filename is required');
      return null;
    }

    try {
      const response = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify',
          backupName: backupFileName
        }),
      });

      const data = await response.json();

      if (data.success) {
        const verification = data.verification;
        const status = verification.isValid ? 'Backup is valid ✅' : 'Backup may be corrupted ⚠️';
        toast.info(status);
        return verification;
      } else {
        throw new Error(data.error || 'Failed to verify backup');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify backup';
      toast.error(errorMessage);
      return null;
    }
  }, []);

  // Format file size for display
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Format date for display
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Get time ago string
  const getTimeAgo = useCallback((dateString: string): string => {
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
  }, [formatDate]);

  // Get backup status based on age and system health
  const getBackupStatus = useCallback(() => {
    if (!state.backups.length) {
      return { status: 'warning', message: 'No backups available' };
    }

    const latestBackup = state.backups[0];
    const latestDate = new Date(latestBackup.created);
    const now = new Date();
    const ageInHours = (now.getTime() - latestDate.getTime()) / (1000 * 60 * 60);

    if (ageInHours < 24) {
      return { status: 'good', message: 'Recent backup available' };
    } else if (ageInHours < 168) { // 7 days
      return { status: 'warning', message: 'Backup is getting old' };
    } else {
      return { status: 'error', message: 'Backup is very old' };
    }
  }, [state.backups]);

  // Get recommended backup frequency
  const getRecommendedFrequency = useCallback(() => {
    if (!state.systemInfo) return 'Weekly';
    
    const { totalRecords } = state.systemInfo.database;
    
    if (totalRecords > 10000) {
      return 'Daily';
    } else if (totalRecords > 1000) {
      return 'Weekly';
    } else {
      return 'Monthly';
    }
  }, [state.systemInfo]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchBackups(), fetchSystemInfo()]);
    };
    loadData();
  }, [fetchBackups, fetchSystemInfo]);

  return {
    ...state,
    fetchBackups,
    fetchSystemInfo,
    createBackup,
    restoreBackup,
    deleteBackup,
    verifyBackup,
    formatFileSize,
    formatDate,
    getTimeAgo,
    getBackupStatus,
    getRecommendedFrequency,
  };
}

export type { 
  BackupFile, 
  DatabaseInfo, 
  BackupInfo, 
  SystemInfo, 
  BackupVerification 
};
