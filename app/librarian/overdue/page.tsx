'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';
import { 
  AlertTriangle, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Clock, 
  DollarSign, 
  BookOpen, 
  User, 
  RefreshCw, 
  Loader2, 
  Send,
  CheckCircle,
  XCircle,
  Download,
  Filter,
  Eye,
  History
} from 'lucide-react';

interface OverdueTransaction {
  transactionId: number;
  borrowedAt: string;
  dueDate: string;
  daysOverdue: number;
  fineAmount: number;
  finePaid: number;
  isReturned: boolean;
  patron: {
    patronId: number;
    patronFirstName: string;
    patronLastName: string;
    patronEmail: string;
    patronType: string;
    details: string;
  };
  item: {
    itemId: number;
    title: string;
    author: string;
    isbn?: string;
    imageUrl?: string;
    subject?: string;
    itemType: string;
    condition: string;
  };
}

interface OverdueStats {
  totalOverdue: number;
  totalFineAmount: number;
  averageDaysOverdue: number;
  newOverdueToday: number;
}

interface OverdueApiResponse {
  overdueTransactions: OverdueTransaction[];
  stats: OverdueStats;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function OverdueManagement() {
  const [overdueTransactions, setOverdueTransactions] = useState<OverdueTransaction[]>([]);
  const [stats, setStats] = useState<OverdueStats>({
    totalOverdue: 0,
    totalFineAmount: 0,
    averageDaysOverdue: 0,
    newOverdueToday: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 10, totalCount: 0, totalPages: 0, hasNext: false, hasPrev: false
  });

  // Modal states
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<OverdueTransaction | null>(null);
  const [reminderMessage, setReminderMessage] = useState('');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);
  const [fineAmount, setFineAmount] = useState<number>(0);

  // Fetch overdue transactions
  const fetchOverdueTransactions = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSeverity !== 'all' && { severity: selectedSeverity })
      });

      const response = await fetch(`/api/librarian/overdue?${params}`);
      const data = await response.json();

      if (data.success) {
        setOverdueTransactions(data.overdueTransactions);
        setStats(data.stats);
        setPagination(data.pagination);
      } else {
        toast.error(data.error || 'Failed to fetch overdue transactions');
      }

    } catch (error) {
      console.error('Error fetching overdue transactions:', error);
      toast.error('Failed to fetch overdue transactions');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOverdueTransactions();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSeverity]);

  // Initial load
  useEffect(() => {
    fetchOverdueTransactions();
  }, []);

  const getSeverityBadge = (daysOverdue: number) => {
    if (daysOverdue <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>;
    } else if (daysOverdue <= 7) {
      return <Badge className="bg-orange-100 text-orange-800">Medium</Badge>;
    } else if (daysOverdue <= 14) {
      return <Badge className="bg-red-100 text-red-800">High</Badge>;
    } else {
      return <Badge className="bg-red-200 text-red-900">Critical</Badge>;
    }
  };

  const handleSendReminder = async () => {
    if (!selectedTransaction || !reminderMessage) return;
    
    try {
      const response = await fetch('/api/librarian/overdue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reminder',
          transactionId: selectedTransaction.transactionId,
          reminderMessage: reminderMessage
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setIsReminderModalOpen(false);
        setReminderMessage('');
        setSelectedTransaction(null);
      } else {
        toast.error(data.error || 'Failed to send reminder');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const handleProcessReturn = async () => {
    if (!selectedTransaction) return;
    
    try {
      setIsProcessingReturn(true);
      
      const response = await fetch('/api/librarian/overdue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'return',
          transactionId: selectedTransaction.transactionId,
          fineAmount: fineAmount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message);
        setIsReturnModalOpen(false);
        setSelectedTransaction(null);
        setFineAmount(0);
        fetchOverdueTransactions(); // Refresh data
      } else {
        toast.error(data.error || 'Failed to process return');
      }
    } catch (error) {
      console.error('Error processing return:', error);
      toast.error('Failed to process return');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const openReminderModal = (transaction: OverdueTransaction) => {
    setSelectedTransaction(transaction);
    setReminderMessage(
      `Dear ${transaction.patron.patronFirstName},\n\nThis is a friendly reminder that the book "${transaction.item.title}" by ${transaction.item.author} was due on ${new Date(transaction.dueDate).toLocaleDateString()} and is now ${transaction.daysOverdue} day(s) overdue.\n\nPlease return the book at your earliest convenience to avoid additional fines.\n\nCurrent fine amount: $${transaction.fineAmount.toFixed(2)}\n\nThank you,\nLibrary Staff`
    );
    setIsReminderModalOpen(true);
  };

  const openReturnModal = (transaction: OverdueTransaction) => {
    setSelectedTransaction(transaction);
    setFineAmount(transaction.fineAmount);
    setIsReturnModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading overdue transactions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overdue Management</h1>
          <p className="text-muted-foreground">
            Manage overdue books and track fines - {stats.totalOverdue} overdue items
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOverdueTransactions}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Export functionality
              const csvData = overdueTransactions.map(t => ({
                'Patron Name': `${t.patron.patronFirstName} ${t.patron.patronLastName}`,
                'Email': t.patron.patronEmail,
                'Book Title': t.item.title,
                'Author': t.item.author,
                'Due Date': new Date(t.dueDate).toLocaleDateString(),
                'Days Overdue': t.daysOverdue,
                'Fine Amount': `$${t.fineAmount.toFixed(2)}`
              }));
              
              const csvContent = 'data:text/csv;charset=utf-8,' + 
                Object.keys(csvData[0] || {}).join(',') + '\n' +
                csvData.map(row => Object.values(row).join(',')).join('\n');
              
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `overdue_items_${new Date().toISOString().split('T')[0]}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              toast.success('Overdue report exported successfully');
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalOverdue}</div>
            <p className="text-xs text-muted-foreground">
              {stats.newOverdueToday > 0 && (
                <span className="text-red-600">+{stats.newOverdueToday} new today</span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fines</CardTitle>
            <DollarSign className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${stats.totalFineAmount.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding amount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Days</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.averageDaysOverdue.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Days overdue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
            <Send className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <Button 
              size="sm" 
              className="w-full" 
            onClick={async () => {
              try {
                // Send batch reminders to all overdue patrons
                const batchPromises = overdueTransactions.map(transaction => 
                  fetch('/api/librarian/overdue', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      action: 'reminder',
                      transactionId: transaction.transactionId,
                      reminderMessage: `Dear ${transaction.patron.patronFirstName},\n\nThis is a friendly reminder that the book "${transaction.item.title}" by ${transaction.item.author} was due on ${new Date(transaction.dueDate).toLocaleDateString()} and is now ${transaction.daysOverdue} day(s) overdue.\n\nPlease return the book at your earliest convenience to avoid additional fines.\n\nCurrent fine amount: $${transaction.fineAmount.toFixed(2)}\n\nThank you,\nLibrary Staff`
                    })
                  })
                );
                
                await Promise.all(batchPromises);
                toast.success(`Batch reminders sent to ${overdueTransactions.length} overdue patrons`);
              } catch (error) {
                toast.error('Failed to send batch reminders');
              }
            }}
            >
              Send All Reminders
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Overdue Items</CardTitle>
          <CardDescription>
            Books that are past their due date and need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by patron name, email, or book title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="low">Low (1-3 days)</SelectItem>
                <SelectItem value="medium">Medium (4-7 days)</SelectItem>
                <SelectItem value="high">High (8-14 days)</SelectItem>
                <SelectItem value="critical">Critical (15+ days)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patron</TableHead>
                <TableHead>Book Details</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Days Overdue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Fine Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overdueTransactions.map((transaction) => (
                <TableRow key={transaction.transactionId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {transaction.patron.patronFirstName} {transaction.patron.patronLastName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {transaction.patron.patronEmail}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {transaction.patron.patronType} - {transaction.patron.details}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{transaction.item.title}</div>
                      <div className="text-sm text-muted-foreground">
                        by {transaction.item.author}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3" />
                      {new Date(transaction.dueDate).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-red-600 font-medium">
                      <Clock className="h-3 w-3" />
                      {transaction.daysOverdue} days
                    </div>
                  </TableCell>
                  <TableCell>
                    {getSeverityBadge(transaction.daysOverdue)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 font-medium text-orange-600">
                      <DollarSign className="h-3 w-3" />
                      {transaction.fineAmount.toFixed(2)}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReminderModal(transaction)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openReturnModal(transaction)}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* No overdue items message */}
          {overdueTransactions.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium">No Overdue Items!</h3>
              <p className="text-sm">All books are returned on time or are still within the due period.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Reminder Modal */}
      <Dialog open={isReminderModalOpen} onOpenChange={setIsReminderModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send Reminder</DialogTitle>
            <DialogDescription>
              Send a reminder email to {selectedTransaction?.patron.patronFirstName} {selectedTransaction?.patron.patronLastName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminderMessage">Message</Label>
              <Textarea
                id="reminderMessage"
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
                rows={8}
                placeholder="Enter reminder message..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReminderModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSendReminder} disabled={!reminderMessage}>
                <Send className="mr-2 h-4 w-4" />
                Send Reminder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Process Return Modal */}
      <Dialog open={isReturnModalOpen} onOpenChange={setIsReturnModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
            <DialogDescription>
              Mark "{selectedTransaction?.item.title}" as returned
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Patron</Label>
                <p className="font-medium">
                  {selectedTransaction?.patron.patronFirstName} {selectedTransaction?.patron.patronLastName}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">Days Overdue</Label>
                <p className="font-medium text-red-600">{selectedTransaction?.daysOverdue} days</p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fineAmount">Fine Amount</Label>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="fineAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsReturnModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleProcessReturn} 
                disabled={isProcessingReturn}
              >
                {isProcessingReturn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Process Return
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
