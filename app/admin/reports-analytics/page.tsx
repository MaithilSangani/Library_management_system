'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Download, FileText, Calendar, TrendingUp, Users, Book, AlertTriangle, DollarSign } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const mockData = {
  circulation: [
    { month: 'Jan', borrowed: 1200, returned: 1150 },
    { month: 'Feb', borrowed: 1350, returned: 1300 },
    { month: 'Mar', borrowed: 1100, returned: 1400 },
    { month: 'Apr', borrowed: 1450, returned: 1200 },
    { month: 'May', borrowed: 1300, returned: 1350 },
    { month: 'Jun', borrowed: 1500, returned: 1450 }
  ],
  bookCategories: [
    { name: 'Fiction', value: 3500, color: '#0088FE' },
    { name: 'Non-Fiction', value: 2800, color: '#00C49F' },
    { name: 'Science', value: 2200, color: '#FFBB28' },
    { name: 'History', value: 1800, color: '#FF8042' },
    { name: 'Biography', value: 1200, color: '#8884D8' }
  ],
  userActivity: [
    { month: 'Jan', newUsers: 45, activeUsers: 580 },
    { month: 'Feb', newUsers: 52, activeUsers: 620 },
    { month: 'Mar', newUsers: 38, activeUsers: 590 },
    { month: 'Apr', newUsers: 61, activeUsers: 670 },
    { month: 'May', newUsers: 49, activeUsers: 640 },
    { month: 'Jun', newUsers: 55, activeUsers: 690 }
  ]
};

export default function ReportsAnalytics() {
  const [selectedPeriod, setSelectedPeriod] = useState('6months');

  const exportReport = (type: string) => {
    console.log(`Exporting ${type} report`);
    // Implementation for report export
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive reports and insights for library operations
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="1year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportReport('comprehensive')}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$4,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Circulated</CardTitle>
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">690</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4%</div>
            <p className="text-xs text-muted-foreground">
              -0.5% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="circulation" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="circulation">Circulation</TabsTrigger>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="circulation" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Circulation Trends</CardTitle>
                <CardDescription>Book borrowing and return patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockData.circulation}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="borrowed" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="returned" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Most Popular Books</CardTitle>
                <CardDescription>Top borrowed books this period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', borrows: 45 },
                    { title: '1984', author: 'George Orwell', borrows: 38 },
                    { title: 'To Kill a Mockingbird', author: 'Harper Lee', borrows: 32 },
                    { title: 'Pride and Prejudice', author: 'Jane Austen', borrows: 28 },
                    { title: 'The Catcher in the Rye', author: 'J.D. Salinger', borrows: 24 }
                  ].map((book, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{book.title}</h4>
                        <p className="text-sm text-muted-foreground">{book.author}</p>
                      </div>
                      <Badge variant="secondary">{book.borrows} borrows</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="collection" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Collection Distribution</CardTitle>
                <CardDescription>Books by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={mockData.bookCategories}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockData.bookCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Statistics</CardTitle>
                <CardDescription>Key metrics about the collection</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Total Books</span>
                    <span className="text-2xl font-bold">12,543</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Books Added This Month</span>
                    <span className="text-2xl font-bold text-green-600">+180</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Books Removed</span>
                    <span className="text-2xl font-bold text-red-600">-12</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Damaged/Lost Books</span>
                    <span className="text-2xl font-bold text-orange-600">8</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Average Book Age</span>
                    <span className="text-2xl font-bold">8.5 years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>User Growth</CardTitle>
                <CardDescription>New users and activity trends</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockData.userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="newUsers" fill="#8884d8" name="New Users" />
                    <Bar dataKey="activeUsers" fill="#82ca9d" name="Active Users" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Demographics</CardTitle>
                <CardDescription>User breakdown by type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Total Users</span>
                    <span className="text-2xl font-bold">1,254</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Active Patrons</span>
                    <span className="text-2xl font-bold text-green-600">1,180</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Librarians</span>
                    <span className="text-2xl font-bold text-blue-600">8</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Administrators</span>
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded-lg">
                    <span className="font-medium">Average Books per User</span>
                    <span className="text-2xl font-bold">2.8</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>Revenue and fine collection details</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>This Month</TableHead>
                    <TableHead>Last Month</TableHead>
                    <TableHead>Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Late Fees</TableCell>
                    <TableCell>$1,234.50</TableCell>
                    <TableCell>$1,156.20</TableCell>
                    <TableCell className="text-green-600">+6.8%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Lost Book Fees</TableCell>
                    <TableCell>$892.30</TableCell>
                    <TableCell>$745.80</TableCell>
                    <TableCell className="text-green-600">+19.6%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Membership Fees</TableCell>
                    <TableCell>$2,105.09</TableCell>
                    <TableCell>$1,980.45</TableCell>
                    <TableCell className="text-green-600">+6.3%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Revenue</TableCell>
                    <TableCell className="font-bold">$4,231.89</TableCell>
                    <TableCell className="font-bold">$3,882.45</TableCell>
                    <TableCell className="font-bold text-green-600">+9.0%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
