'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import {
  BookOpen,
  BookCheck,
  AlertTriangle,
  Clock,
  User,
  DollarSign,
  Bell,
  RefreshCw,
  ExternalLink,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivitiesProps {
  data: {
    recentActivity: Array<{
      id: number;
      type: 'return' | 'borrow';
      description: string;
      timestamp: string;
      status: 'completed' | 'active' | 'overdue';
    }>;
    requests: {
      recentRequests: Array<{
        id: number;
        patron: string;
        item: string;
        status: string;
        requestedAt: string;
        type: 'borrow_request';
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
  };
  loading?: boolean;
  onRefresh?: () => void;
}

export function RecentActivities({ data, loading, onRefresh }: RecentActivitiesProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                    <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-48"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-gray-100 rounded">
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getActivityIcon = (type: string, status: string) => {
    if (type === 'return') return BookCheck;
    if (type === 'borrow') return BookOpen;
    return User;
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'active': return 'text-blue-600';
      case 'overdue': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'secondary';
      case 'APPROVED': return 'default';
      case 'REJECTED': return 'destructive';
      case 'completed': return 'default';
      case 'active': return 'secondary';
      case 'overdue': return 'destructive';
      default: return 'secondary';
    }
  };

  const getAlertSeverity = (alertType: string, count: number) => {
    switch (alertType) {
      case 'overdue':
        return count > 10 ? 'high' : count > 5 ? 'medium' : 'low';
      case 'pending':
        return count > 20 ? 'high' : count > 10 ? 'medium' : 'low';
      case 'notifications':
        return count > 50 ? 'high' : count > 20 ? 'medium' : 'low';
      default:
        return 'low';
    }
  };

  const alerts = [
    {
      title: 'Overdue Books',
      count: data.alerts.overdueBooks,
      type: 'overdue',
      icon: AlertTriangle,
      description: 'Books past due date',
      action: 'View Details'
    },
    {
      title: 'Pending Requests',
      count: data.alerts.pendingRequests,
      type: 'pending',
      icon: Clock,
      description: 'Awaiting approval',
      action: 'Process Requests'
    },
    {
      title: 'Unread Notifications',
      count: data.alerts.unreadNotifications,
      type: 'notifications',
      icon: Bell,
      description: 'System notifications',
      action: 'View All'
    },
    {
      title: 'Low Stock Items',
      count: data.alerts.lowStock,
      type: 'stock',
      icon: TrendingUp,
      description: 'Items with low availability',
      action: 'Manage Inventory'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Recent Activities */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest system activities and transactions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="space-y-4">
              {data.recentActivity.slice(0, 10).map((activity) => {
                const Icon = getActivityIcon(activity.type, activity.status);
                const timeAgo = formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true });

                return (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`p-2 rounded-full bg-gray-100`}>
                      <Icon className={`h-4 w-4 ${getActivityColor(activity.status)}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{timeAgo}</p>
                        <Badge variant={getStatusBadgeColor(activity.status)} className="text-xs">
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Recent Requests */}
              {data.requests.recentRequests.slice(0, 5).map((request) => {
                const timeAgo = formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true });

                return (
                  <div key={`req-${request.id}`} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 rounded-full bg-gray-100">
                      <BookOpen className="h-4 w-4 text-orange-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {request.patron} requested "{request.item}"
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{timeAgo}</p>
                        <Badge variant={getStatusBadgeColor(request.status)} className="text-xs">
                          {request.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Alerts & System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alerts & Status
          </CardTitle>
          <CardDescription>
            System alerts and health status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {alerts.map((alert, index) => {
              const Icon = alert.icon;
              const severity = getAlertSeverity(alert.type, alert.count);
              const severityColor = 
                severity === 'high' ? 'border-red-200 bg-red-50' :
                severity === 'medium' ? 'border-orange-200 bg-orange-50' :
                'border-gray-200 bg-gray-50';

              return (
                <div key={index} className={`p-3 rounded-lg border ${severityColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${
                        severity === 'high' ? 'text-red-600' :
                        severity === 'medium' ? 'text-orange-600' :
                        'text-gray-600'
                      }`} />
                      <span className="font-medium text-sm">{alert.title}</span>
                    </div>
                    <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}>
                      {alert.count}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{alert.description}</p>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {alert.action}
                  </Button>
                </div>
              );
            })}

            {/* System Health */}
            <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-sm text-green-800">System Health</span>
              </div>
              <div className="space-y-2 text-xs text-green-700">
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="font-medium">{data.systemStatus.databaseStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span>CPU Usage:</span>
                  <span className="font-medium">{data.systemStatus.serverHealth.cpu}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Memory:</span>
                  <span className="font-medium">{data.systemStatus.serverHealth.memory}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(data.systemStatus.lastBackup), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
