'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Switch } from '@/app/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { toast } from 'sonner';
import { 
  Users, 
  BookOpen, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  RefreshCw,
  Clock,
  DollarSign,
  UserPlus,
  Calendar,
  Wifi,
  WifiOff,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useDashboardStats, dashboardMetrics, useDashboardMetric } from '@/app/hooks/useDashboardStats';

interface DynamicDashboardProps {
  userRole?: 'librarian' | 'admin';
  compact?: boolean;
  showControls?: boolean;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function DynamicDashboard({ 
  userRole = 'librarian', 
  compact = false,
  showControls = true 
}: DynamicDashboardProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [visibleSections, setVisibleSections] = useState({
    overview: true,
    patrons: true,
    activity: true,
    trends: true,
    alerts: true
  });

  const {
    stats,
    loading,
    error,
    isConnected,
    lastRefresh,
    refetch,
    toggleAutoRefresh,
    setRefreshInterval,
    autoRefresh
  } = useDashboardStats({
    autoRefresh: true,
    refreshInterval: 30000,
    onError: (error) => {
      console.error('Dashboard error:', error);
    },
    onUpdate: (stats) => {
      // Handle important alerts
      if (stats.alerts.overdueBooks > 10) {
        toast.warning(`High number of overdue books: ${stats.alerts.overdueBooks}`);
      }
    }
  });

  // Individual metric hooks for granular updates
  const totalPatrons = useDashboardMetric(stats, dashboardMetrics.totalPatrons);
  const overdueBooks = useDashboardMetric(stats, dashboardMetrics.overdueBooks);
  const activeTransactions = useDashboardMetric(stats, dashboardMetrics.activeTransactions);

  const handleRefreshIntervalChange = (value: string) => {
    const interval = parseInt(value);
    setRefreshInterval(interval);
    toast.success(`Auto-refresh interval set to ${interval / 1000} seconds`);
  };

  const toggleSection = (section: keyof typeof visibleSections) => {
    setVisibleSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (error && !stats) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dashboard Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Dashboard</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-muted-foreground">
              Real-time library management overview
            </p>
            {!isConnected && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <WifiOff className="h-3 w-3" />
                Offline
              </Badge>
            )}
            {isConnected && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                Connected
              </Badge>
            )}
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {showControls && (
          <div className="flex items-center gap-2">
            {/* Auto-refresh toggle */}
            <div className="flex items-center space-x-2">
              <label htmlFor="auto-refresh" className="text-sm font-medium">
                Auto-refresh
              </label>
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={toggleAutoRefresh}
              />
            </div>

            {/* Refresh interval selector */}
            {autoRefresh && (
              <Select defaultValue="30000" onValueChange={handleRefreshIntervalChange}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10000">10s</SelectItem>
                  <SelectItem value="30000">30s</SelectItem>
                  <SelectItem value="60000">1m</SelectItem>
                  <SelectItem value="300000">5m</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Manual refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

            {/* Settings toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dashboard Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(visibleSections).map(([key, visible]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Switch
                    id={key}
                    checked={visible}
                    onCheckedChange={() => toggleSection(key as keyof typeof visibleSections)}
                  />
                  <label htmlFor={key} className="text-sm font-medium capitalize">
                    {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    {key}
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Overview Statistics */}
      {visibleSections.overview && stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patrons</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-blue-600">
                {stats.overview.totalPatrons.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.patrons.newToday > 0 && (
                  <span className="text-green-600">
                    +{stats.patrons.newToday} new today
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-green-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <BookOpen className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-green-600">
                {stats.transactions.active.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.transactions.today > 0 && (
                  <span className="text-blue-600">
                    +{stats.transactions.today} today
                  </span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${
              stats.transactions.overdue > 0 
                ? 'from-red-50 to-red-100' 
                : 'from-green-50 to-green-100'
            } opacity-50`} />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${
                stats.transactions.overdue > 0 ? 'text-red-600' : 'text-green-600'
              }`} />
            </CardHeader>
            <CardContent className="relative">
              <div className={`text-2xl font-bold ${
                stats.transactions.overdue > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {stats.transactions.overdue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.transactions.overdue === 0 ? 'All books returned on time!' : 'Requires attention'}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-purple-100 opacity-50" />
            <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent className="relative">
              <div className="text-2xl font-bold text-purple-600">
                {stats.overview.utilizationRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Books currently borrowed
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Patron Breakdown */}
      {visibleSections.patrons && stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patron Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.patrons.students}
                    </div>
                    <p className="text-sm text-muted-foreground">Students</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {stats.patrons.faculty}
                    </div>
                    <p className="text-sm text-muted-foreground">Faculty</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {stats.patrons.general}
                    </div>
                    <p className="text-sm text-muted-foreground">General</p>
                  </div>
                </div>

                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Students', value: stats.patrons.students, color: '#8B5CF6' },
                          { name: 'Faculty', value: stats.patrons.faculty, color: '#6366F1' },
                          { name: 'General', value: stats.patrons.general, color: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {[
                          { name: 'Students', value: stats.patrons.students, color: '#8B5CF6' },
                          { name: 'Faculty', value: stats.patrons.faculty, color: '#6366F1' },
                          { name: 'General', value: stats.patrons.general, color: '#6B7280' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fines Collected Today</span>
                  <span className="font-bold text-green-600">
                    ${stats.finances.finesPaidToday.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Outstanding Fines</span>
                  <span className="font-bold text-red-600">
                    ${stats.finances.totalFinesOwed.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Estimated Overdue Amount</span>
                  <span className="font-bold text-orange-600">
                    ${stats.finances.estimatedOverdueAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Trends */}
      {visibleSections.trends && stats && stats.trends.daily.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Transaction Trends (Last 7 Days)
            </CardTitle>
            <CardDescription>
              Daily transaction activity showing borrowing patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.trends.daily}>
                  <defs>
                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value) => [value, 'Transactions']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="#3B82F6" 
                    fillOpacity={1} 
                    fill="url(#colorTransactions)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {visibleSections.activity && stats && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Recent Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center space-x-3 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.isOverdue ? 'bg-red-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{transaction.itemTitle}</p>
                      <p className="text-muted-foreground truncate">
                        by {transaction.patronName}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(transaction.borrowedAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {stats.recentActivity.transactions.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent transactions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                New Registrations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.registrations.slice(0, 5).map((registration) => (
                  <div key={registration.id} className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{registration.name}</p>
                      <p className="text-muted-foreground truncate">
                        {registration.userType}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(registration.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
                {stats.recentActivity.registrations.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent registrations
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts and Notifications */}
      {visibleSections.alerts && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {stats.alerts.overdueBooks > 0 && (
                <div className="flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Overdue Books</p>
                    <p className="text-sm text-red-600">
                      {stats.alerts.overdueBooks} books need attention
                    </p>
                  </div>
                </div>
              )}
              
              {stats.alerts.pendingReturns > 10 && (
                <div className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">High Activity</p>
                    <p className="text-sm text-yellow-600">
                      {stats.alerts.pendingReturns} active transactions
                    </p>
                  </div>
                </div>
              )}

              {stats.alerts.overdueBooks === 0 && stats.alerts.pendingReturns <= 10 && (
                <div className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <Activity className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">All Systems Normal</p>
                    <p className="text-sm text-green-600">
                      No critical issues detected
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
