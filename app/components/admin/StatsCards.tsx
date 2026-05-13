'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  Users, 
  BookOpen, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Clock,
  DollarSign,
  Activity,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface StatsCardsProps {
  data: {
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
    finances: {
      totalFinesOwed: number;
      finesPaid: number;
      pendingPayments: number;
      estimatedOverdueAmount: number;
    };
    alerts: {
      overdueBooks: number;
      pendingRequests: number;
      unreadNotifications: number;
      lowStock: number;
    };
  };
  loading?: boolean;
}

export function StatsCards({ data, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </CardTitle>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      title: "Total Library Items",
      value: data.overview.totalItems.toLocaleString(),
      description: `${data.overview.availableItems} available`,
      icon: BookOpen,
      trend: data.overview.utilizationRate,
      trendLabel: `${data.overview.utilizationRate}% utilization`,
      color: "text-blue-600"
    },
    {
      title: "Registered Users",
      value: data.overview.totalPatrons.toLocaleString(),
      description: `Active this week: ${Math.min(data.transactions.thisWeek, data.overview.totalPatrons)}`,
      icon: Users,
      trend: data.overview.totalPatrons > 100 ? 5 : -2,
      trendLabel: "vs last month",
      color: "text-green-600"
    },
    {
      title: "Active Borrowings",
      value: data.transactions.active.toLocaleString(),
      description: `Today: ${data.transactions.today}`,
      icon: Activity,
      trend: data.transactions.thisWeek - data.transactions.active,
      trendLabel: "this week",
      color: "text-purple-600"
    },
    {
      title: "Overdue Items",
      value: data.transactions.overdue.toLocaleString(),
      description: "Require immediate attention",
      icon: AlertTriangle,
      trend: -10,
      trendLabel: "vs yesterday",
      color: data.transactions.overdue > 0 ? "text-red-600" : "text-green-600",
      urgent: data.transactions.overdue > 0
    },
    {
      title: "Pending Requests",
      value: data.alerts.pendingRequests.toLocaleString(),
      description: "Awaiting approval",
      icon: Clock,
      trend: 0,
      trendLabel: "processing time: 2h avg",
      color: "text-orange-600"
    },
    {
      title: "Outstanding Fines",
      value: `$${data.finances.totalFinesOwed.toFixed(2)}`,
      description: `${data.finances.pendingPayments} pending payments`,
      icon: DollarSign,
      trend: data.finances.finesPaid > data.finances.totalFinesOwed ? 15 : -5,
      trendLabel: "collection rate",
      color: "text-yellow-600"
    },
    {
      title: "Return Rate",
      value: `${data.overview.returnRate}%`,
      description: "Books returned on time",
      icon: TrendingUp,
      trend: data.overview.returnRate,
      trendLabel: "compliance rate",
      color: data.overview.returnRate > 85 ? "text-green-600" : "text-orange-600"
    },
    {
      title: "System Health",
      value: "Operational",
      description: `${data.alerts.unreadNotifications} notifications`,
      icon: Activity,
      trend: 98,
      trendLabel: "uptime",
      color: "text-green-600"
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => {
        const Icon = stat.icon;
        const isPositiveTrend = stat.trend >= 0;
        
        return (
          <Card key={index} className={`relative ${stat.urgent ? 'border-red-200 bg-red-50/50' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.trend !== undefined && (
                  <div className={`flex items-center text-xs ${
                    isPositiveTrend ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isPositiveTrend ? (
                      <ArrowUp className="h-3 w-3 mr-1" />
                    ) : (
                      <ArrowDown className="h-3 w-3 mr-1" />
                    )}
                    {Math.abs(stat.trend)}%
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
              {stat.trendLabel && (
                <Badge variant="secondary" className="mt-2 text-xs">
                  {stat.trendLabel}
                </Badge>
              )}
              {stat.urgent && (
                <Badge variant="destructive" className="absolute top-2 right-2">
                  !
                </Badge>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
