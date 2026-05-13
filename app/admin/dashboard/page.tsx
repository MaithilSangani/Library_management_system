'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { StatsCards } from '@/app/components/admin/StatsCards';
import { AdminCharts } from '@/app/components/admin/AdminCharts';
import { RecentActivities } from '@/app/components/admin/RecentActivities';
import { ReportGenerator } from '@/app/components/admin/ReportGenerator';
import { 
  RefreshCw, 
  Download, 
  BarChart3, 
  Activity,
  Settings,
  AlertCircle,
  TrendingUp,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  overview: {
    totalItems: number;
    totalPatrons: number;
    activeTransactions: number;
    availableItems: number;
    utilizationRate: number;
    returnRate: number;
  };
  transactions: {
    total: number;
    active: number;
    overdue: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  users: {
    total: number;
    newToday: number;
    newThisWeek: number;
    activeUsers: number;
  };
  requests: {
    pendingBorrows: number;
    activeReservations: number;
    recentRequests: Array<{
      id: number;
      patron: string;
      item: string;
      status: string;
      requestedAt: string;
      type: 'borrow_request';
    }>;
  };
  finances: {
    totalFinesOwed: number;
    finesPaid: number;
    pendingPayments: number;
    estimatedOverdueAmount: number;
  };
  items: {
    byType: Array<{
      type: string;
      count: number;
    }>;
    byCondition: Array<{
      condition: string;
      count: number;
    }>;
    mostBorrowed: Array<{
      title: string;
      author: string;
      borrowCount: number;
    }>;
  };
  recentActivity: Array<{
    id: number;
    type: 'return' | 'borrow';
    description: string;
    timestamp: string;
    status: 'completed' | 'active' | 'overdue';
  }>;
  trends: {
    daily: Array<{
      date: string;
      borrowings: number;
    }>;
  };
  alerts: {
    overdueBooks: number;
    pendingRequests: number;
    unreadNotifications: number;
    lowStock: number;
    systemHealth: string;
  };
  systemStatus: {
    databaseStatus: string;
    lastBackup: string;
    serverHealth: {
      cpu: number;
      memory: number;
      disk: number;
    };
  };
  lastUpdated: string;
  refreshInterval: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchDashboardData = async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      
      const response = await fetch('/api/admin/dashboard', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setError(null);
        if (showToast) {
          toast.success('Dashboard refreshed successfully');
        }
      } else {
        throw new Error(result.error || 'Failed to fetch dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard');
      if (showToast) {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      setLoading(false);
      if (showToast) setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'export' }),
      });

      const result = await response.json();

      if (result.success) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `admin-dashboard-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('Dashboard data exported successfully');
      } else {
        throw new Error(result.error || 'Failed to export data');
      }
    } catch (error) {
      toast.error('Failed to export dashboard data');
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-96"></div>
        </div>
        <StatsCards data={{} as any} loading={true} />
        <AdminCharts data={{} as any} loading={true} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to the administrator panel.
          </p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Loading Dashboard
            </CardTitle>
            <CardDescription>
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchDashboardData(true)} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  const urgentAlerts = data.alerts.overdueBooks + data.alerts.pendingRequests;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your library system in real-time.
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              Last updated: {new Date(data.lastUpdated).toLocaleTimeString()}
            </Badge>
            {urgentAlerts > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentAlerts} urgent alerts
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <StatsCards data={data} loading={loading} />

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <RecentActivities 
            data={data} 
            loading={loading} 
            onRefresh={() => fetchDashboardData(true)} 
          />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AdminCharts data={data} loading={loading} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportGenerator data={data} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
