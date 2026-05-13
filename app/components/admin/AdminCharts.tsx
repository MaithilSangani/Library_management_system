'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

interface AdminChartsProps {
  data: {
    trends: {
      daily: Array<{
        date: string;
        borrowings: number;
      }>;
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
    finances: {
      totalFinesOwed: number;
      finesPaid: number;
      pendingPayments: number;
      estimatedOverdueAmount: number;
    };
    transactions: {
      total: number;
      active: number;
      overdue: number;
      today: number;
      thisWeek: number;
      thisMonth: number;
    };
  };
  loading?: boolean;
}

const COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#06B6D4',
  success: '#22C55E',
  muted: '#6B7280'
};

const PIE_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.danger, COLORS.warning];

export function AdminCharts({ data, loading }: AdminChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-48"></div>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Data validation and fallbacks
  const safeData = {
    trends: {
      daily: data?.trends?.daily || []
    },
    items: {
      byType: data?.items?.byType || [],
      byCondition: data?.items?.byCondition || [],
      mostBorrowed: data?.items?.mostBorrowed || []
    },
    finances: {
      totalFinesOwed: data?.finances?.totalFinesOwed || 0,
      finesPaid: data?.finances?.finesPaid || 0,
      pendingPayments: data?.finances?.pendingPayments || 0,
      estimatedOverdueAmount: data?.finances?.estimatedOverdueAmount || 0
    },
    transactions: {
      total: data?.transactions?.total || 0,
      active: data?.transactions?.active || 0,
      overdue: data?.transactions?.overdue || 0
    }
  };

  // Prepare data for charts with safe data and empty state handling
  const borrowingTrendData = safeData.trends.daily.length > 0 
    ? safeData.trends.daily.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      }))
    : [{ date: 'No Data', borrowings: 0 }];

  const itemTypeData = safeData.items.byType.length > 0
    ? safeData.items.byType.map(item => ({
        name: item.type.charAt(0).toUpperCase() + item.type.slice(1).toLowerCase(),
        value: item.count
      }))
    : [{ name: 'No Items', value: 1 }];

  const itemConditionData = safeData.items.byCondition.length > 0
    ? safeData.items.byCondition.map(item => ({
        name: item.condition.charAt(0).toUpperCase() + item.condition.slice(1).toLowerCase().replace('_', ' '),
        value: item.count
      }))
    : [{ name: 'No Data', value: 1 }];

  const popularBooksData = safeData.items.mostBorrowed.length > 0
    ? safeData.items.mostBorrowed.slice(0, 5).map(item => ({
        name: item.title && item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title || 'Unknown',
        borrowings: item.borrowCount || 0,
        author: item.author || 'Unknown'
      }))
    : [{ name: 'No Books Borrowed Yet', borrowings: 0, author: '' }];

  const transactionOverviewData = [
    { name: 'Active', value: safeData.transactions.active, color: COLORS.primary },
    { name: 'Overdue', value: safeData.transactions.overdue, color: COLORS.danger },
    { name: 'Completed', value: Math.max(0, safeData.transactions.total - safeData.transactions.active), color: COLORS.success }
  ].filter(item => item.value > 0).concat(
    safeData.transactions.total === 0 ? [{ name: 'No Transactions', value: 1, color: COLORS.muted }] : []
  );

  const financialOverviewData = [
    { name: 'Fines Owed', amount: safeData.finances.totalFinesOwed },
    { name: 'Fines Paid', amount: safeData.finances.finesPaid },
    { name: 'Estimated Overdue', amount: safeData.finances.estimatedOverdueAmount }
  ].filter(item => item.amount > 0).concat(
    safeData.finances.totalFinesOwed === 0 && safeData.finances.finesPaid === 0 
      ? [{ name: 'No Financial Data', amount: 0 }] : []
  );

  return (
    <div className="grid gap-6">
      {/* Borrowing Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Borrowing Trends (Last 7 Days)</CardTitle>
          <CardDescription>
            Daily borrowing activity and patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={borrowingTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [value, 'Borrowings']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area 
                type="monotone" 
                dataKey="borrowings" 
                stroke={COLORS.primary} 
                fill={COLORS.primary}
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        {/* Item Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Library Collection</CardTitle>
            <CardDescription>Distribution by item type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={itemTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {itemTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Transaction Status */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Status</CardTitle>
            <CardDescription>Current borrowing status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={transactionOverviewData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {transactionOverviewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Most Popular Books */}
        <Card>
          <CardHeader>
            <CardTitle>Most Borrowed Items</CardTitle>
            <CardDescription>Top 5 popular library items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={popularBooksData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: number) => [value, 'Times Borrowed']}
                  labelFormatter={(label) => `Book: ${label}`}
                />
                <Bar dataKey="borrowings" fill={COLORS.secondary} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Item Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Item Conditions</CardTitle>
            <CardDescription>Physical condition of library items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={itemConditionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill={COLORS.info} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>
            Fines and payment statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={financialOverviewData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'Amount']}
              />
              <Bar dataKey="amount" fill={COLORS.accent} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
