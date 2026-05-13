'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Book, Users, AlertTriangle, Clock, Plus, Search, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardData {
  stats: {
    totalBooks: number;
    availableBooks: number;
    borrowedBooks: number;
    overdueBooks: number;
    booksAddedThisWeek: number;
  };
  overdueItems: Array<{
    book: string;
    author: string;
    patron: string;
    days: number;
    dueDate: string;
  }>;
  popularBooks: Array<{
    book: string;
    author: string;
    requests: number;
    available: number;
  }>;
  recentActivity: Array<{
    type: string;
    message: string;
    details: string;
    timeAgo: string;
    color: string;
  }>;
    todaySummary: {
      booksIssued: number;
      booksReturned: number;
      booksAdded: number;
    };
}

export default function LibrarianDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from API first
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const apiData = await response.json();
        if (apiData.success) {
          // Transform API data to dashboard format
          const transformedData: DashboardData = {
            stats: {
              totalBooks: apiData.data.overview.totalItems || 0,
              availableBooks: apiData.data.overview.availableItems || 0,
              borrowedBooks: apiData.data.transactions.active || 0,
              overdueBooks: apiData.data.transactions.overdue || 0,
              booksAddedThisWeek: 0 // Not available in API yet
            },
            overdueItems: [], // Will be populated from API data if available
            popularBooks: [], // Will be populated from API data if available
            recentActivity: apiData.data.recentActivity?.transactions?.map((t: any) => ({
              type: "transaction",
              message: t.isOverdue ? "Overdue book" : "Book activity",
              details: `${t.itemTitle} by ${t.patronName}`,
              timeAgo: "Recently",
              color: t.isOverdue ? "red" : "blue"
            })) || [],
            todaySummary: {
              booksIssued: apiData.data.transactions.today || 0,
              booksReturned: 0, // Not available in current API
              booksAdded: 0 // Not available in current API
            }
          };
          
          setDashboardData(transformedData);
          return;
        }
      }
      
      // Fallback to mock data if API fails
      const mockData: DashboardData = {
        stats: {
          totalBooks: 1250,
          availableBooks: 980,
          borrowedBooks: 270,
          overdueBooks: 12,
          booksAddedThisWeek: 5
        },
        overdueItems: [
          {
            book: "The Great Gatsby",
            author: "F. Scott Fitzgerald",
            patron: "John Smith",
            days: 5,
            dueDate: "2024-01-15"
          },
          {
            book: "To Kill a Mockingbird",
            author: "Harper Lee",
            patron: "Jane Doe",
            days: 3,
            dueDate: "2024-01-17"
          }
        ],
        popularBooks: [
          {
            book: "1984",
            author: "George Orwell",
            requests: 15,
            available: 2
          },
          {
            book: "Pride and Prejudice",
            author: "Jane Austen",
            requests: 12,
            available: 0
          }
        ],
        recentActivity: [
          {
            type: "borrow",
            message: "Book borrowed",
            details: "Harry Potter and the Philosopher's Stone by Alice Johnson",
            timeAgo: "5 minutes ago",
            color: "blue"
          },
          {
            type: "return",
            message: "Book returned",
            details: "The Catcher in the Rye by Bob Wilson",
            timeAgo: "10 minutes ago",
            color: "green"
          },
          {
            type: "register",
            message: "New patron registered",
            details: "Sarah Davis joined the library",
            timeAgo: "1 hour ago",
            color: "purple"
          }
        ],
        todaySummary: {
          booksIssued: 24,
          booksReturned: 19,
          booksAdded: 2
        }
      };
      
      setDashboardData(mockData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Get color classes for activity indicators
  const getActivityColor = (color: string) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'orange': return 'bg-orange-500';
      case 'purple': return 'bg-purple-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Librarian Dashboard</h1>
          <p className="text-muted-foreground">
            Manage books and library operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
          <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
            <Search className="mr-2 h-4 w-4" />
            Quick Search
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Available</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.availableBooks?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground flex items-center">
              {dashboardData?.stats.booksAddedThisWeek ? (
                <>
                  <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
                  +{dashboardData.stats.booksAddedThisWeek} added this week
                </>
              ) : (
                'No new books this week'
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Borrowed</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.borrowedBooks?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Total active loans
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.stats.totalBooks?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Complete library collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${(dashboardData?.stats.overdueBooks || 0) > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(dashboardData?.stats.overdueBooks || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {dashboardData?.stats.overdueBooks?.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {(dashboardData?.stats.overdueBooks || 0) > 0 ? 'Need immediate attention' : 'All books on time!'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used librarian tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button className="w-full justify-start opacity-50 cursor-not-allowed" variant="outline" disabled>
              <Book className="mr-2 h-4 w-4" />
              Issue Book to Patron
            </Button>
            <Button className="w-full justify-start opacity-50 cursor-not-allowed" variant="outline" disabled>
              <Book className="mr-2 h-4 w-4" />
              Return Book
            </Button>
            <Button className="w-full justify-start opacity-50 cursor-not-allowed" variant="outline" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Add New Book
            </Button>
            <Button className="w-full justify-start opacity-50 cursor-not-allowed" variant="outline" disabled>
              <AlertTriangle className="mr-2 h-4 w-4" />
              View Overdue Items
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest library operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardData?.recentActivity && dashboardData.recentActivity.length > 0 ? (
                dashboardData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={`h-2 w-2 ${getActivityColor(activity.color)} rounded-full`}></div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">{activity.details} - {activity.timeAgo}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No recent activity to display
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Overdue Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Overdue Items</span>
              <Badge className={`${(dashboardData?.stats.overdueBooks || 0) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {dashboardData?.stats.overdueBooks || 0}
              </Badge>
            </CardTitle>
            <CardDescription>Books that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.overdueItems && dashboardData.overdueItems.length > 0 ? (
                dashboardData.overdueItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.book}</p>
                      <p className="text-sm text-muted-foreground">{item.patron}</p>
                    </div>
                    <Badge variant="destructive">{item.days} day{item.days !== 1 ? 's' : ''}</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <p>No overdue books!</p>
                  <p className="text-xs">All loans are on time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Popular Books */}
        <Card>
          <CardHeader>
            <CardTitle>Most Requested Books</CardTitle>
            <CardDescription>Books with waiting lists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData?.popularBooks && dashboardData.popularBooks.length > 0 ? (
                dashboardData.popularBooks.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.book}</p>
                      <p className="text-sm text-muted-foreground">{item.requests} waiting</p>
                    </div>
                    <Badge className={item.available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {item.available} available
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Book className="h-8 w-8 mx-auto mb-2" />
                  <p>No reservations yet</p>
                  <p className="text-xs">Popular books will appear here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Today's Summary
          </CardTitle>
          <CardDescription>
            Summary of today's library activities ({new Date().toLocaleDateString()})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {dashboardData?.todaySummary.booksIssued || 0}
              </div>
              <p className="text-sm text-muted-foreground">Books Issued</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {dashboardData?.todaySummary.booksReturned || 0}
              </div>
              <p className="text-sm text-muted-foreground">Books Returned</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {dashboardData?.todaySummary.booksAdded || 0}
              </div>
              <p className="text-sm text-muted-foreground">Books Added</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
