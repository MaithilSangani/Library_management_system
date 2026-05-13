'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity
} from 'lucide-react';
import { useReports } from '@/app/hooks/useReports';
import { toast } from 'sonner';

export default function Reports() {
  const {
    data,
    loading,
    error,
    activeReport,
    dateRange,
    setActiveReport,
    updateDateRange,
    applyDateRangeOption,
    exportToCSV,
    formatCurrency,
    formatPercentage,
    formatNumber,
    getDateRangeOptions,
    getChartColors
  } = useReports();

  const [customDateRange, setCustomDateRange] = useState({
    start: dateRange.start,
    end: dateRange.end
  });

  const chartColors = getChartColors();
  const dateRangeOptions = getDateRangeOptions();

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    setCustomDateRange(prev => ({ ...prev, [field]: value }));
  };

  const applyCustomDateRange = () => {
    updateDateRange(customDateRange);
  };

  const reportTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'transactions', label: 'Transactions', icon: BookOpen },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'books', label: 'Collection', icon: BookOpen },
    { id: 'financials', label: 'Financials', icon: DollarSign },
    { id: 'trends', label: 'Trends', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights and data analysis from your library system
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select onValueChange={applyDateRangeOption}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Quick ranges" />
            </SelectTrigger>
            <SelectContent>
              {dateRangeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Date Range</span>
          </CardTitle>
          <CardDescription>
            Select a custom date range for your reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => handleDateRangeChange('start', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => handleDateRangeChange('end', e.target.value)}
                />
              </div>
            </div>
            <Button onClick={applyCustomDateRange} className="mt-6">
              <RefreshCw className="mr-2 h-4 w-4" />
              Update Reports
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Reports */}
      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="grid w-full grid-cols-6">
          {reportTabs.map(tab => {
            const Icon = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center space-x-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading overview...</span>
              </CardContent>
            </Card>
          ) : data.overview ? (
            <>
              {/* Key Metrics */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(data.overview.totalUsers)}</div>
                    <p className="text-xs text-muted-foreground">
                      +{data.overview.newUsersInPeriod} in selected period
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Books</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(data.overview.totalBooks)}</div>
                    <p className="text-xs text-muted-foreground">
                      {data.overview.activeTransactions} currently borrowed
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Transactions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{data.overview.activeTransactions}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(data.overview.overdueRate)} overdue rate
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fine Collection</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(data.overview.paidFines)}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatPercentage(data.overview.collectionRate)} collection rate
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Overview Summary */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health</CardTitle>
                    <CardDescription>Current status indicators</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Overdue Items</span>
                      <div className="flex items-center space-x-2">
                        <Badge className={data.overview.overdueBooks > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {data.overview.overdueBooks}
                        </Badge>
                        {data.overview.overdueBooks === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pending Requests</span>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-100 text-blue-800">
                          {data.overview.pendingRequests}
                        </Badge>
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Period Activity</span>
                      <Badge className="bg-green-100 text-green-800">
                        {data.overview.transactionsInPeriod} transactions
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Financial Overview</CardTitle>
                    <CardDescription>Revenue and collection metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Total Fines</span>
                      <span className="font-bold">{formatCurrency(data.overview.totalFines)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Collected (Period)</span>
                      <span className="font-bold text-green-600">{formatCurrency(data.overview.paidFines)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Collection Rate</span>
                      <Badge className="bg-blue-100 text-blue-800">
                        {formatPercentage(data.overview.collectionRate)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No overview data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading transaction data...</span>
              </CardContent>
            </Card>
          ) : data.transactions ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Transactions by Month */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transactions by Month</CardTitle>
                    <CardDescription>Monthly borrowing activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.transactions.transactionsByMonth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={chartColors[0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Transactions by Status */}
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Status</CardTitle>
                    <CardDescription>Current status distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.transactions.transactionsByStatus}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="count"
                        >
                          {data.transactions.transactionsByStatus.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Borrowed Books */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Top Borrowed Books</CardTitle>
                      <CardDescription>Most popular books in the selected period</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(data.transactions.topBorrowedBooks, 'top-borrowed-books')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-right">Borrow Count</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.transactions.topBorrowedBooks.map((book: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{book.borrowCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Average Loan Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {Math.round(data.transactions.averageLoanDuration)} days
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Return Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {data.transactions.returnRates.total > 0 
                        ? ((data.transactions.returnRates.returned / data.transactions.returnRates.total) * 100).toFixed(1)
                        : 0
                      }%
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Active Loans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {data.transactions.returnRates.active || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No transaction data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading user data...</span>
              </CardContent>
            </Card>
          ) : data.users ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {/* User Growth */}
                <Card>
                  <CardHeader>
                    <CardTitle>User Registration Growth</CardTitle>
                    <CardDescription>New user registrations over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={data.users.userGrowth}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="count" stroke={chartColors[2]} fill={chartColors[2]} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Users by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Users by Type</CardTitle>
                    <CardDescription>Distribution of user roles</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Patrons', value: data.users.usersByType.patron },
                            { name: 'Librarians', value: data.users.usersByType.librarian },
                            { name: 'Admins', value: data.users.usersByType.admin }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[0, 1, 2].map((index: number) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Top Active Patrons */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Most Active Patrons</CardTitle>
                      <CardDescription>Top users by transaction count in selected period</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(data.users.topPatrons, 'top-active-patrons')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead className="text-right">Transactions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.users.topPatrons.map((patron: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{patron.name}</TableCell>
                          <TableCell>{patron.email}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{patron.transactionCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* User Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Patrons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data.users.activePatronsCount}</div>
                    <p className="text-sm text-muted-foreground">In selected period</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Students vs Faculty</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {data.users.studentVsFaculty.map((item: any) => (
                        <div key={item.type} className="flex justify-between">
                          <span>{item.type}</span>
                          <Badge variant="outline">{item.count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>User Engagement</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {data.users.usersByType.patron > 0 
                        ? ((data.users.activePatronsCount / data.users.usersByType.patron) * 100).toFixed(1)
                        : 0
                      }%
                    </div>
                    <p className="text-sm text-muted-foreground">Active user rate</p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No user data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Books Tab */}
        <TabsContent value="books" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading collection data...</span>
              </CardContent>
            </Card>
          ) : data.books ? (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Books by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Collection by Category</CardTitle>
                    <CardDescription>Books distributed by item type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.books.booksByCategory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" fill={chartColors[3]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Borrowing Trends by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Borrowing by Category</CardTitle>
                    <CardDescription>Most borrowed item types</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.books.borrowingTrends}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ itemType, percent }: any) => `${itemType}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="borrowCount"
                        >
                          {data.books.borrowingTrends.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Collection Statistics */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Total Books</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatNumber(data.books.collectionStats.totalBooks || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Total Copies</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatNumber(data.books.collectionStats.totalCopies || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Available</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatNumber(data.books.collectionStats.availableCopies || 0)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Avg. Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {formatCurrency(data.books.collectionStats.averagePrice || 0)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Authors */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Popular Authors</CardTitle>
                      <CardDescription>Most borrowed authors in selected period</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportToCSV(data.books.topAuthors, 'popular-authors')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-right">Books in Collection</TableHead>
                        <TableHead className="text-right">Times Borrowed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.books.topAuthors.map((author: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{author.author}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="outline">{author.bookCount}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{author.borrowCount}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No collection data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Financials Tab */}
        <TabsContent value="financials" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading financial data...</span>
              </CardContent>
            </Card>
          ) : data.financials ? (
            <>
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue by Month</CardTitle>
                  <CardDescription>Monthly revenue from all payment sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.financials.revenueByMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke={chartColors[4]} 
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Payments by Type */}
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Type</CardTitle>
                    <CardDescription>Revenue sources breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data.financials.paymentsByType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percent }: any) => `${type}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="amount"
                        >
                          {data.financials.paymentsByType.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Summary</CardTitle>
                    <CardDescription>Key financial metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Fine Collection Rate</span>
                      <Badge className="bg-green-100 text-green-800">
                        {data.financials.fineCollection.total > 0 
                          ? ((data.financials.fineCollection.collected / data.financials.fineCollection.total) * 100).toFixed(1)
                          : 0
                        }%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Outstanding Payments</span>
                      <span className="font-bold text-red-600">
                        {formatCurrency(data.financials.outstandingPayments.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total Collected</span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(data.financials.fineCollection.collected || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Methods */}
              {data.financials.paymentMethods && data.financials.paymentMethods.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>Preferred payment methods</CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToCSV(data.financials.paymentMethods, 'payment-methods')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Payment Method</TableHead>
                          <TableHead className="text-right">Transactions</TableHead>
                          <TableHead className="text-right">Total Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.financials.paymentMethods.map((method: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{method.paymentMethod}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline">{method.count}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(method.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No financial data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2 text-muted-foreground">Loading trends data...</span>
              </CardContent>
            </Card>
          ) : data.trends ? (
            <>
              {/* Daily Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity Trend</CardTitle>
                  <CardDescription>Transaction volume over selected period</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data.trends.dailyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area 
                        type="monotone" 
                        dataKey="transactions" 
                        stroke={chartColors[5]} 
                        fill={chartColors[5]}
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                {/* Popular Times */}
                <Card>
                  <CardHeader>
                    <CardTitle>Popular Hours</CardTitle>
                    <CardDescription>Transaction volume by hour of day</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data.trends.popularTimes}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="hour" 
                          tickFormatter={(hour) => `${hour}:00`}
                        />
                        <YAxis />
                        <Tooltip labelFormatter={(hour) => `${hour}:00`} />
                        <Bar dataKey="count" fill={chartColors[6]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Seasonal Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seasonal Trends</CardTitle>
                    <CardDescription>Activity by month of year</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data.trends.seasonalTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="month"
                          tickFormatter={(month) => {
                            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                            return monthNames[month - 1];
                          }}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(month) => {
                            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                                              'July', 'August', 'September', 'October', 'November', 'December'];
                            return monthNames[month - 1];
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          stroke={chartColors[7]} 
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="average" 
                          stroke={chartColors[8]} 
                          strokeWidth={1}
                          strokeDasharray="5 5"
                          dot={{ r: 2 }}
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Growth Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Growth Metrics</CardTitle>
                  <CardDescription>Period-over-period growth indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {data.trends.growthMetrics.map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-semibold capitalize">{metric.metric}</h4>
                          <p className="text-sm text-muted-foreground">In selected period</p>
                        </div>
                        <div className="text-2xl font-bold">
                          {formatNumber(metric.current_period)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">No trends data available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
