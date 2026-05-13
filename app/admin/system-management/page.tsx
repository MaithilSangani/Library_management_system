'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Checkbox } from '@/app/components/ui/checkbox';
import { 
  Trash2, 
  Archive, 
  Database, 
  FileText, 
  Bell, 
  Settings, 
  Server,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Loader2,
  Filter,
  Calendar,
  Search,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemLog {
  id: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  source: string;
  userId?: string;
  ip?: string;
}

interface NotificationRecord {
  id: string;
  recipientType: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  readAt?: string;
  isRead: boolean;
  recipientName: string;
}

interface BackupRecord {
  id: string;
  filename: string;
  size: number;
  type: 'AUTO' | 'MANUAL';
  status: 'COMPLETED' | 'FAILED' | 'IN_PROGRESS';
  createdAt: string;
  description?: string;
}

interface ReportRecord {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  createdAt: string;
  size: number;
  downloadCount: number;
  status: 'READY' | 'GENERATING' | 'EXPIRED';
}

interface SystemStats {
  logs: {
    total: number;
    errors: number;
    warnings: number;
    lastError?: string;
  };
  notifications: {
    total: number;
    unread: number;
    oldestUnread?: string;
  };
  backups: {
    total: number;
    failed: number;
    totalSize: number;
    lastBackup?: string;
  };
  reports: {
    total: number;
    expired: number;
    totalSize: number;
  };
  storage: {
    used: number;
    available: number;
    percentage: number;
  };
}

export default function SystemManagement() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState<SystemStats | null>(null);
  
  // Data states
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  
  // Filter states
  const [logFilter, setLogFilter] = useState({
    level: 'ALL',
    source: 'ALL',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  const [notificationFilter, setNotificationFilter] = useState({
    type: 'ALL',
    read: 'ALL',
    dateFrom: '',
    dateTo: '',
    search: ''
  });
  
  // Processing states
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    try {
      setLoading(true);
      const [statsRes, logsRes, notificationsRes, backupsRes, reportsRes] = await Promise.all([
        fetch('/api/admin/system/stats'),
        fetch('/api/admin/system/logs'),
        fetch('/api/admin/system/notifications'),
        fetch('/api/admin/system/backups'),
        fetch('/api/admin/system/reports')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }

      if (notificationsRes.ok) {
        const notificationsData = await notificationsRes.json();
        setNotifications(notificationsData.notifications || []);
      }

      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.backups || []);
      }

      if (reportsRes.ok) {
        const reportsData = await reportsRes.json();
        setReports(reportsData.reports || []);
      }

    } catch (error) {
      console.error('Error fetching system data:', error);
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  // Delete Functions
  const deleteSystemLogs = async (logIds: string[]) => {
    try {
      setProcessing(prev => new Set([...prev, ...logIds]));
      
      const response = await fetch('/api/admin/system/logs', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logIds })
      });

      if (response.ok) {
        toast.success(`${logIds.length} log(s) deleted successfully`);
        fetchSystemData();
        setSelectedItems(new Set());
      } else {
        throw new Error('Failed to delete logs');
      }
    } catch (error) {
      console.error('Error deleting logs:', error);
      toast.error('Failed to delete logs');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        logIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const archiveOldLogs = async (days: number) => {
    try {
      setBulkProcessing(true);
      
      const response = await fetch('/api/admin/system/logs/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ olderThanDays: days })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.archivedCount} logs archived successfully`);
        fetchSystemData();
      } else {
        throw new Error('Failed to archive logs');
      }
    } catch (error) {
      console.error('Error archiving logs:', error);
      toast.error('Failed to archive logs');
    } finally {
      setBulkProcessing(false);
    }
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      setProcessing(prev => new Set([...prev, ...notificationIds]));
      
      const response = await fetch('/api/admin/system/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationIds })
      });

      if (response.ok) {
        toast.success(`${notificationIds.length} notification(s) deleted successfully`);
        fetchSystemData();
        setSelectedItems(new Set());
      } else {
        throw new Error('Failed to delete notifications');
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
      toast.error('Failed to delete notifications');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        notificationIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const deleteBackups = async (backupIds: string[]) => {
    try {
      setProcessing(prev => new Set([...prev, ...backupIds]));
      
      const response = await fetch('/api/admin/system/backups', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupIds })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${backupIds.length} backup(s) deleted, ${result.spaceFreed} freed`);
        fetchSystemData();
        setSelectedItems(new Set());
      } else {
        throw new Error('Failed to delete backups');
      }
    } catch (error) {
      console.error('Error deleting backups:', error);
      toast.error('Failed to delete backups');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        backupIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const deleteReports = async (reportIds: string[]) => {
    try {
      setProcessing(prev => new Set([...prev, ...reportIds]));
      
      const response = await fetch('/api/admin/system/reports', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportIds })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${reportIds.length} report(s) deleted, ${result.spaceFreed} freed`);
        fetchSystemData();
        setSelectedItems(new Set());
      } else {
        throw new Error('Failed to delete reports');
      }
    } catch (error) {
      console.error('Error deleting reports:', error);
      toast.error('Failed to delete reports');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        reportIds.forEach(id => newSet.delete(id));
        return newSet;
      });
    }
  };

  const clearOldNotifications = async (days: number) => {
    try {
      setBulkProcessing(true);
      
      const response = await fetch('/api/admin/system/notifications/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ olderThanDays: days, readOnly: true })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`${result.deletedCount} old notifications cleared`);
        fetchSystemData();
      } else {
        throw new Error('Failed to clear notifications');
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    } finally {
      setBulkProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'WARN': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      case 'DEBUG': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'GENERATING': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && !stats) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Management</h1>
          <p className="text-muted-foreground">Manage system resources and maintenance</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Management</h1>
          <p className="text-muted-foreground">
            Manage system resources, logs, notifications, and maintenance tasks
          </p>
        </div>
        <Button onClick={fetchSystemData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* System Overview Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Logs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.logs.total}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="text-red-600">{stats.logs.errors} errors</span>
                <span className="text-yellow-600">{stats.logs.warnings} warnings</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.notifications.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.notifications.unread} unread
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backups</CardTitle>
              <Archive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.backups.total}</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(stats.backups.totalSize)} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.storage.percentage}%</div>
              <p className="text-xs text-muted-foreground">
                {formatBytes(stats.storage.used)} used
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabbed Management Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        {/* System Logs Management - REMOVED */}
        {/* <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>System Logs Management</CardTitle>
                  <CardDescription>View and manage system logs</CardDescription>
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive Old Logs
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Archive Old Logs</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will archive logs older than 30 days. Archived logs will be moved to storage and removed from the active database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => archiveOldLogs(30)}>
                          Archive Logs
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {selectedItems.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedItems.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Selected Logs</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {selectedItems.size} selected log entries? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteSystemLogs(Array.from(selectedItems))}>
                            Delete Logs
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Log Filters */}
              <div className="flex flex-wrap gap-4 mb-4">
                <Select value={logFilter.level} onValueChange={(value) => setLogFilter({...logFilter, level: value})}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Levels</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                    <SelectItem value="WARN">Warning</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="DEBUG">Debug</SelectItem>
                  </SelectContent>
                </Select>
                
                <Input
                  placeholder="Search logs..."
                  value={logFilter.search}
                  onChange={(e) => setLogFilter({...logFilter, search: e.target.value})}
                  className="max-w-64"
                />
              </div>

              {/* Logs Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.size === logs.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(new Set(logs.map(log => log.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.has(log.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedItems);
                            if (checked) {
                              newSelected.add(log.id);
                            } else {
                              newSelected.delete(log.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge className={getLevelColor(log.level)}>
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-96 truncate">{log.message}</TableCell>
                      <TableCell>{log.source}</TableCell>
                      <TableCell>{formatDate(log.timestamp)}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={processing.has(log.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Log Entry</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this log entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSystemLogs([log.id])}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent> */}

        {/* Notifications Management */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Notifications Management</CardTitle>
                  <CardDescription>Manage system notifications</CardDescription>
                </div>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear Read Notifications
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Clear Old Notifications</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will delete all read notifications older than 7 days.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => clearOldNotifications(7)}>
                          Clear Notifications
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  {selectedItems.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedItems.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Notifications</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete {selectedItems.size} selected notifications?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteNotifications(Array.from(selectedItems))}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.size === notifications.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(new Set(notifications.map(n => n.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.has(notification.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedItems);
                            if (checked) {
                              newSelected.add(notification.id);
                            } else {
                              newSelected.delete(notification.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell>{notification.recipientName}</TableCell>
                      <TableCell className="max-w-64 truncate">{notification.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{notification.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={notification.isRead ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}>
                          {notification.isRead ? 'Read' : 'Unread'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(notification.createdAt)}</TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              disabled={processing.has(notification.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Notification</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete this notification permanently?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteNotifications([notification.id])}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backups Management */}
        <TabsContent value="backups" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Backup Management</CardTitle>
                  <CardDescription>Manage database backups</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedItems.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedItems.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Backup Files</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete {selectedItems.size} backup files? This will free up storage space but cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteBackups(Array.from(selectedItems))}>
                            Delete Backups
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.size === backups.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(new Set(backups.map(b => b.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backups.map((backup) => (
                    <TableRow key={backup.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.has(backup.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedItems);
                            if (checked) {
                              newSelected.add(backup.id);
                            } else {
                              newSelected.delete(backup.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-mono">{backup.filename}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{backup.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(backup.status)}>
                          {backup.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(backup.size)}</TableCell>
                      <TableCell>{formatDate(backup.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={processing.has(backup.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Backup</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete backup "{backup.filename}"? This will free up {formatBytes(backup.size)} of storage.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteBackups([backup.id])}>
                                  Delete Backup
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
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Management */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reports Management</CardTitle>
                  <CardDescription>Manage generated reports</CardDescription>
                </div>
                <div className="flex gap-2">
                  {selectedItems.size > 0 && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected ({selectedItems.size})
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Report Files</AlertDialogTitle>
                          <AlertDialogDescription>
                            Delete {selectedItems.size} report files? This will free up storage space.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteReports(Array.from(selectedItems))}>
                            Delete Reports
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedItems.size === reports.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedItems(new Set(reports.map(r => r.id)));
                          } else {
                            setSelectedItems(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Report Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Downloads</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedItems.has(report.id)}
                          onCheckedChange={(checked) => {
                            const newSelected = new Set(selectedItems);
                            if (checked) {
                              newSelected.add(report.id);
                            } else {
                              newSelected.delete(report.id);
                            }
                            setSelectedItems(newSelected);
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{report.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.type}</Badge>
                      </TableCell>
                      <TableCell>{report.generatedBy}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(report.status)}>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatBytes(report.size)}</TableCell>
                      <TableCell>{report.downloadCount}</TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                disabled={processing.has(report.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Report</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Delete report "{report.name}"? This will free up {formatBytes(report.size)} of storage.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteReports([report.id])}>
                                  Delete Report
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
