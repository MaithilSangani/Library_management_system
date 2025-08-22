'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Book, Users, AlertTriangle, Clock, Plus, Search } from 'lucide-react';

export default function LibrarianDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Librarian Dashboard</h1>
          <p className="text-muted-foreground">
            Manage books, patrons, and library operations
          </p>
        </div>
        <div className="flex space-x-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
          <Button variant="outline">
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
            <div className="text-2xl font-bold">8,743</div>
            <p className="text-xs text-muted-foreground">
              +45 added this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Borrowed</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,800</div>
            <p className="text-xs text-muted-foreground">
              +12% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patrons</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,054</div>
            <p className="text-xs text-muted-foreground">
              +8 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              -5 from yesterday
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
            <Button className="w-full justify-start" variant="outline">
              <Book className="mr-2 h-4 w-4" />
              Issue Book to Patron
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Book className="mr-2 h-4 w-4" />
              Return Book
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Register New Patron
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Add New Book
            </Button>
            <Button className="w-full justify-start" variant="outline">
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
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Book returned: "The Great Gatsby"</p>
                  <p className="text-xs text-muted-foreground">by John Doe - 2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">New book added: "1984"</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Book issued: "Pride and Prejudice"</p>
                  <p className="text-xs text-muted-foreground">to Jane Smith - 10 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-purple-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">New patron registered</p>
                  <p className="text-xs text-muted-foreground">Mike Johnson - 15 minutes ago</p>
                </div>
              </div>
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
              <Badge className="bg-red-100 text-red-800">23</Badge>
            </CardTitle>
            <CardDescription>Books that need immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { book: "To Kill a Mockingbird", patron: "Sarah Wilson", days: 5 },
                { book: "1984", patron: "David Brown", days: 3 },
                { book: "The Catcher in the Rye", patron: "Emily Davis", days: 2 },
                { book: "Lord of the Flies", patron: "Michael Johnson", days: 1 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.book}</p>
                    <p className="text-sm text-muted-foreground">{item.patron}</p>
                  </div>
                  <Badge variant="destructive">{item.days} days</Badge>
                </div>
              ))}
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
              {[
                { book: "Dune", requests: 8, available: 2 },
                { book: "The Great Gatsby", requests: 6, available: 1 },
                { book: "To Kill a Mockingbird", requests: 5, available: 0 },
                { book: "Pride and Prejudice", requests: 4, available: 3 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{item.book}</p>
                    <p className="text-sm text-muted-foreground">{item.requests} waiting</p>
                  </div>
                  <Badge className={item.available > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {item.available} available
                  </Badge>
                </div>
              ))}
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
          <CardDescription>Summary of today's library activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">12</div>
              <p className="text-sm text-muted-foreground">Books Issued</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">8</div>
              <p className="text-sm text-muted-foreground">Books Returned</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">3</div>
              <p className="text-sm text-muted-foreground">New Registrations</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">2</div>
              <p className="text-sm text-muted-foreground">Books Added</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
