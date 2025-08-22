'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { BookOpen, RotateCcw, Calendar, User, Search, Plus } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'Issue' | 'Return' | 'Renew';
  bookTitle: string;
  patronName: string;
  isbn: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  fine?: number;
  status: 'Active' | 'Returned' | 'Overdue';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'Issue',
    bookTitle: 'The Great Gatsby',
    patronName: 'John Doe',
    isbn: '978-0-7432-7356-5',
    issueDate: '2024-08-15',
    dueDate: '2024-08-29',
    status: 'Active'
  },
  {
    id: '2',
    type: 'Return',
    bookTitle: '1984',
    patronName: 'Jane Smith',
    isbn: '978-0-452-28423-4',
    issueDate: '2024-08-10',
    dueDate: '2024-08-24',
    returnDate: '2024-08-22',
    status: 'Returned'
  },
  {
    id: '3',
    type: 'Issue',
    bookTitle: 'To Kill a Mockingbird',
    patronName: 'Bob Wilson',
    isbn: '978-0-06-112008-4',
    issueDate: '2024-08-05',
    dueDate: '2024-08-19',
    status: 'Overdue',
    fine: 2.50
  }
];

export default function Circulation() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [searchTerm, setSearchTerm] = useState('');
  const [isIssueBookOpen, setIsIssueBookOpen] = useState(false);
  const [isReturnBookOpen, setIsReturnBookOpen] = useState(false);

  const filteredTransactions = transactions.filter(transaction =>
    transaction.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.patronName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.isbn.includes(searchTerm)
  );

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-100 text-blue-800';
      case 'Returned': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Circulation Management</h1>
          <p className="text-muted-foreground">
            Issue books, process returns, and manage renewals
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isIssueBookOpen} onOpenChange={setIsIssueBookOpen}>
            <DialogTrigger asChild>
              <Button>
                <BookOpen className="mr-2 h-4 w-4" />
                Issue Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Issue Book to Patron</DialogTitle>
                <DialogDescription>
                  Select a book and patron to create a new loan
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="patron-search" className="text-right">
                    Patron
                  </Label>
                  <Input id="patron-search" placeholder="Search patron..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="book-search" className="text-right">
                    Book
                  </Label>
                  <Input id="book-search" placeholder="Search by title or ISBN..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="due-date" className="text-right">
                    Due Date
                  </Label>
                  <Input id="due-date" type="date" className="col-span-3" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsIssueBookOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsIssueBookOpen(false)}>
                  Issue Book
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isReturnBookOpen} onOpenChange={setIsReturnBookOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Return Book
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Return Book</DialogTitle>
                <DialogDescription>
                  Process a book return and calculate any fines
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-search" className="text-right">
                    Book/ISBN
                  </Label>
                  <Input id="return-search" placeholder="Search by title or ISBN..." className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="return-date" className="text-right">
                    Return Date
                  </Label>
                  <Input id="return-date" type="date" className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="condition" className="text-right">
                    Condition
                  </Label>
                  <select id="condition" className="col-span-3 px-3 py-2 border border-gray-300 rounded-md">
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="damaged">Damaged</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsReturnBookOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsReturnBookOpen(false)}>
                  Process Return
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.status === 'Active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <Calendar className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {transactions.filter(t => t.status === 'Overdue').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returns Today</CardTitle>
            <RotateCcw className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transactions.filter(t => t.returnDate === new Date().toISOString().split('T')[0]).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fines</CardTitle>
            <User className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${transactions.reduce((sum, t) => sum + (t.fine || 0), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Loans</TabsTrigger>
          <TabsTrigger value="overdue">Overdue Items</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Loans</CardTitle>
              <CardDescription>
                Currently issued books that are still active
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Patron</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions
                    .filter(t => t.status === 'Active')
                    .map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.bookTitle}</div>
                          <div className="text-sm text-muted-foreground">{transaction.isbn}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.patronName}</TableCell>
                      <TableCell>{transaction.issueDate}</TableCell>
                      <TableCell>{transaction.dueDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            Renew
                          </Button>
                          <Button variant="outline" size="sm">
                            Return
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Overdue Items</CardTitle>
              <CardDescription>
                Books that are past their due date and need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Patron</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                    <TableHead>Fine</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions
                    .filter(t => t.status === 'Overdue')
                    .map((transaction) => (
                    <TableRow key={transaction.id} className="bg-red-50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.bookTitle}</div>
                          <div className="text-sm text-muted-foreground">{transaction.isbn}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.patronName}</TableCell>
                      <TableCell>{transaction.dueDate}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">
                          {calculateDaysOverdue(transaction.dueDate)} days
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-red-600">
                        ${transaction.fine?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            Contact
                          </Button>
                          <Button variant="outline" size="sm">
                            Return
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Recent circulation transactions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Book Details</TableHead>
                    <TableHead>Patron</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Badge variant={transaction.type === 'Issue' ? 'default' : 'secondary'}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transaction.bookTitle}</div>
                          <div className="text-sm text-muted-foreground">{transaction.isbn}</div>
                        </div>
                      </TableCell>
                      <TableCell>{transaction.patronName}</TableCell>
                      <TableCell>
                        {transaction.type === 'Return' ? transaction.returnDate : transaction.issueDate}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(transaction.status)}>
                          {transaction.status}
                        </Badge>
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
