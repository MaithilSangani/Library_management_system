'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  History, 
  Search, 
  Filter, 
  Calendar,
  User,
  BookOpen,
  Eye,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface Transaction {
  transactionId: number;
  borrowedAt: string;
  returnedAt?: string;
  dueDate: string;
  isReturned: boolean;
  finePaid?: number;
  calculatedFine: number;
  totalFinePaid: number;
  outstandingFine: number;
  daysOverdue: number;
  status: 'active' | 'returned' | 'overdue';
  patronName: string;
  patronType: string;
  patronDetails: string;
  renewalCount: number;
  rating?: number;
  review?: string;
  recordType: 'transaction';
  date: string;
  item: {
    itemId: number;
    title: string;
    author: string;
    isbn?: string;
    itemType: string;
    condition: string;
    imageUrl?: string;
    subject?: string;
  };
  patron: {
    patronId: number;
    patronFirstName: string;
    patronLastName: string;
    patronEmail: string;
    isStudent: boolean;
    isFaculty: boolean;
  };
  finepayment: Array<{
    paymentId: number;
    amount: number;
    paidAt: string;
    paymentMethod: string;
  }>;
}

interface Payment {
  paymentId: number;
  recordType: 'payment';
  patron: {
    patronId: number;
    patronFirstName: string;
    patronLastName: string;
    patronEmail: string;
    isStudent: boolean;
    isFaculty: boolean;
  };
  patronName: string;
  patronType: string;
  patronDetails: string;
  amount: number;
  paymentType: string;
  paymentStatus: 'PAID' | 'PENDING' | 'FAILED';
  description?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  date: string;
  createdAt: string;
  paidAt?: string;
  relatedTransaction?: {
    transactionId: number;
    itemTitle?: string;
    itemAuthor?: string;
  };
}

type Record = Transaction | Payment;

interface TransactionSummary {
  totalTransactions: number;
  activeLoans: number;
  overdueItems: number;
  returnedBooks: number;
  totalFinesCollected: number;
  outstandingFines: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function TransactionHistory() {
  const [records, setRecords] = useState<Record[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [recordTypeFilter, setRecordTypeFilter] = useState('all'); // all, transactions, payments
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Fetch transactions and payments
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });

      const response = await fetch(`/api/librarian/transaction-history?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data.records || []); // Combined records
        setTransactions(data.data.transactions || []);
        setPayments(data.data.payments || []);
        setSummary(data.data.summary);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.error || 'Failed to fetch transaction history');
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error loading transaction history');
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, pageSize, statusFilter]);

  // Search with debounce
  useEffect(() => {
    if (searchTerm === '') {
      fetchTransactions();
      return;
    }

    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchTransactions();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Date filter change
  useEffect(() => {
    if (dateFrom && dateTo) {
      setCurrentPage(1);
      fetchTransactions();
    }
  }, [dateFrom, dateTo]);

  // Clear filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Export functionality
  const exportTransactions = async () => {
    try {
      const params = new URLSearchParams({
        limit: '10000', // Export all
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo })
      });

      const response = await fetch(`/api/librarian/transaction-history?${params}`);
      const data = await response.json();

      if (data.success) {
        const csvContent = generateCombinedCSV(data.data.records || [], data.data.transactions || [], data.data.payments || []);
        downloadCSV(csvContent, 'library-records-export.csv');
        toast.success('Library records exported successfully');
      } else {
        toast.error('Failed to export data');
      }
    } catch (error) {
      toast.error('Error exporting data');
    }
  };

  const generateCombinedCSV = (records: Record[], transactions: Transaction[], payments: Payment[]) => {
    // Combined records CSV
    const combinedHeaders = [
      'Record Type',
      'ID',
      'Patron Name',
      'Patron Type',
      'Patron Details',
      'Date',
      'Amount/Fine',
      'Status',
      'Title/Description',
      'Author/Payment Type',
      'ISBN/Reference',
      'Payment Method',
      'Notes'
    ];

    const combinedRows = records.map(record => {
      if (record.recordType === 'transaction') {
        const t = record as Transaction;
        return [
          'Transaction',
          t.transactionId,
          t.patronName,
          t.patronType,
          t.patronDetails,
          new Date(t.borrowedAt).toLocaleDateString(),
          t.calculatedFine > 0 ? `$${t.calculatedFine.toFixed(2)}` : '$0.00',
          t.status,
          t.item.title,
          t.item.author,
          t.item.isbn || 'N/A',
          'N/A',
          t.returnedAt ? `Returned: ${new Date(t.returnedAt).toLocaleDateString()}` : 'Not returned'
        ];
      } else {
        const p = record as Payment;
        return [
          'Payment',
          p.paymentId,
          p.patronName,
          p.patronType,
          p.patronDetails,
          new Date(p.date).toLocaleDateString(),
          `$${p.amount.toFixed(2)}`,
          p.paymentStatus,
          p.description || 'General payment',
          p.paymentType,
          p.paymentReference || 'N/A',
          p.paymentMethod || 'N/A',
          p.notes || 'N/A'
        ];
      }
    });

    // Add separator and transaction details
    const transactionHeaders = [
      '',
      'DETAILED TRANSACTION RECORDS',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ];

    const detailedTransactionHeaders = [
      'Transaction ID',
      'Book Title',
      'Author',
      'ISBN',
      'Patron Name',
      'Patron Type',
      'Borrowed Date',
      'Due Date',
      'Returned Date',
      'Status',
      'Days Overdue',
      'Fine Amount',
      'Fine Paid',
      'Outstanding Fine'
    ];

    const transactionRows = transactions.map(t => [
      t.transactionId,
      t.item.title,
      t.item.author,
      t.item.isbn || 'N/A',
      t.patronName,
      t.patronType,
      new Date(t.borrowedAt).toLocaleDateString(),
      new Date(t.dueDate).toLocaleDateString(),
      t.returnedAt ? new Date(t.returnedAt).toLocaleDateString() : 'Not returned',
      t.status,
      t.daysOverdue,
      t.calculatedFine.toFixed(2),
      t.totalFinePaid.toFixed(2),
      t.outstandingFine.toFixed(2)
    ]);

    // Add separator and payment details
    const paymentHeaders = [
      '',
      'DETAILED PAYMENT RECORDS',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ];

    const detailedPaymentHeaders = [
      'Payment ID',
      'Amount',
      'Payment Type',
      'Payment Status',
      'Description',
      'Patron Name',
      'Patron Type',
      'Created Date',
      'Paid Date',
      'Payment Method',
      'Reference',
      'Related Transaction',
      'Notes'
    ];

    const paymentRows = payments.map(p => [
      p.paymentId,
      p.amount.toFixed(2),
      p.paymentType,
      p.paymentStatus,
      p.description || 'N/A',
      p.patronName,
      p.patronType,
      new Date(p.createdAt).toLocaleDateString(),
      p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'N/A',
      p.paymentMethod || 'N/A',
      p.paymentReference || 'N/A',
      p.relatedTransaction ? `#${p.relatedTransaction.transactionId}` : 'N/A',
      p.notes || 'N/A'
    ]);

    // Combine all sections
    const allRows = [
      combinedHeaders,
      ...combinedRows,
      [''], // Empty row separator
      transactionHeaders,
      detailedTransactionHeaders,
      ...transactionRows,
      [''], // Empty row separator
      paymentHeaders,
      detailedPaymentHeaders,
      ...paymentRows
    ];

    return allRows.map(row => row.join(',')).join('\n');
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // View transaction details
  const viewTransactionDetails = async (transaction: Transaction) => {
    try {
      const response = await fetch('/api/librarian/transaction-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: transaction.transactionId })
      });

      const data = await response.json();
      if (data.success) {
        setSelectedTransaction(data.data);
        setIsDetailsModalOpen(true);
      } else {
        toast.error('Failed to fetch transaction details');
      }
    } catch (error) {
      toast.error('Error loading transaction details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading && !transactions.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading transaction history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-8 w-8" />
            Transaction History
          </h1>
          <p className="text-muted-foreground">
            Comprehensive view of all library transactions and their details
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTransactions} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportTransactions}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Records</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalRecords || summary.totalTransactions}</div>
                <div className="text-xs text-muted-foreground">
                  {summary.totalTransactions || 0} transactions + {summary.totalPayments || 0} payments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.activeLoans || 0}</div>
                <div className="text-xs text-muted-foreground">
                  Currently borrowed books
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.overdueItems || 0}</div>
                <div className="text-xs text-muted-foreground">
                  Books past due date
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returned Books</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.returnedBooks || 0}</div>
                <div className="text-xs text-muted-foreground">
                  Successfully returned
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fines Collected</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ${(summary.totalFinesCollected || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  From overdue books
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding Fines</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  ${(summary.outstandingFines || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Unpaid overdue fines
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">General Payments</CardTitle>
                <DollarSign className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">
                  ${(summary.totalGeneralPayments || 0).toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  From patron panel payments
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
                <CheckCircle className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-indigo-600">
                  {summary.paidPayments || 0}/{(summary.paidPayments || 0) + (summary.pendingPayments || 0)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Paid vs Pending payments
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books, patrons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Page Size</Label>
              <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
                  <SelectItem value="50">50 per page</SelectItem>
                  <SelectItem value="100">100 per page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
            {(searchTerm || statusFilter || dateFrom || dateTo) && (
              <Alert className="flex-1">
                <AlertDescription>
                  Filters active: {[
                    searchTerm && 'Search',
                    statusFilter && `Status: ${statusFilter}`,
                    dateFrom && 'Date range'
                  ].filter(Boolean).join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Combined Records Table with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>All Records</CardTitle>
          <CardDescription>
            {pagination && `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} records`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="combined" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="combined">All Records ({(summary?.totalRecords || 0)})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({(summary?.totalTransactions || 0)})</TabsTrigger>
              <TabsTrigger value="payments">Payments ({(summary?.totalPayments || 0)})</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
            </TabsList>
            
            <TabsContent value="combined" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Patron</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount/Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record) => (
                      <TableRow key={`${record.recordType}-${record.recordType === 'transaction' ? (record as Transaction).transactionId : (record as Payment).paymentId}`}>
                        <TableCell>
                          <Badge variant={record.recordType === 'transaction' ? 'default' : 'secondary'}>
                            {record.recordType === 'transaction' ? 'Transaction' : 'Payment'}
                          </Badge>
                        </TableCell>
                        
                        <TableCell className="font-mono text-sm">
                          #{record.recordType === 'transaction' ? (record as Transaction).transactionId : (record as Payment).paymentId}
                        </TableCell>
                        
                        <TableCell>
                          {record.recordType === 'transaction' ? (
                            <div className="space-y-1">
                              <div className="font-medium">{(record as Transaction).item.title}</div>
                              <div className="text-sm text-muted-foreground">
                                by {(record as Transaction).item.author}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                ISBN: {(record as Transaction).item.isbn || 'N/A'}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="font-medium">${(record as Payment).amount.toFixed(2)} - {(record as Payment).paymentType}</div>
                              <div className="text-sm text-muted-foreground">
                                {(record as Payment).description || 'General payment'}
                              </div>
                              {(record as Payment).relatedTransaction && (
                                <div className="text-xs text-muted-foreground">
                                  Related to: {(record as Payment).relatedTransaction.itemTitle}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{record.patronName}</div>
                            <div className="text-sm text-muted-foreground">
                              {record.patronType}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {record.patronDetails}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          {formatDate(record.date)}
                        </TableCell>

                        <TableCell>
                          {record.recordType === 'transaction' ? (
                            <div>
                              <Badge className={getStatusColor((record as Transaction).status)}>
                                {(record as Transaction).status.charAt(0).toUpperCase() + (record as Transaction).status.slice(1)}
                              </Badge>
                              {(record as Transaction).calculatedFine > 0 && (
                                <div className="text-xs text-red-600 mt-1">
                                  Fine: ${(record as Transaction).calculatedFine.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <Badge className={(
                                (record as Payment).paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                                (record as Payment).paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {(record as Payment).paymentStatus}
                              </Badge>
                              <div className="text-xs text-muted-foreground mt-1">
                                ${(record as Payment).amount.toFixed(2)}
                              </div>
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {record.recordType === 'transaction' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewTransactionDetails(record as Transaction)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Details
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}

                    {records.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Book Details</TableHead>
                      <TableHead>Patron</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.transactionId}>
                        <TableCell className="font-mono text-sm">
                          #{transaction.transactionId}
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{transaction.item.title}</div>
                            <div className="text-sm text-muted-foreground">
                              by {transaction.item.author}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              ISBN: {transaction.item.isbn || 'N/A'}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{transaction.patronName}</div>
                            <div className="text-sm text-muted-foreground">
                              {transaction.patronType}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.patronDetails}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          {formatDate(transaction.borrowedAt)}
                        </TableCell>

                        <TableCell className="text-sm">
                          <div className={transaction.status === 'overdue' ? 'text-red-600 font-medium' : ''}>
                            {formatDate(transaction.dueDate)}
                            {transaction.status === 'overdue' && (
                              <div className="text-xs">
                                {transaction.daysOverdue} days overdue
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </Badge>
                          {transaction.returnedAt && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Returned: {formatDate(transaction.returnedAt)}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          {transaction.calculatedFine > 0 ? (
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-red-600">
                                ${transaction.calculatedFine.toFixed(2)}
                              </div>
                              {transaction.totalFinePaid > 0 && (
                                <div className="text-xs text-green-600">
                                  Paid: ${transaction.totalFinePaid.toFixed(2)}
                                </div>
                              )}
                              {transaction.outstandingFine > 0 && (
                                <div className="text-xs text-orange-600">
                                  Outstanding: ${transaction.outstandingFine.toFixed(2)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No fine</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => viewTransactionDetails(transaction)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}

                    {transactions.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="payments" className="mt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Patron</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.paymentId}>
                        <TableCell className="font-mono text-sm">
                          #{payment.paymentId}
                        </TableCell>
                        
                        <TableCell className="font-medium">
                          ${payment.amount.toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{payment.paymentType}</div>
                            {payment.description && (
                              <div className="text-sm text-muted-foreground">
                                {payment.description}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{payment.patronName}</div>
                            <div className="text-sm text-muted-foreground">
                              {payment.patronType}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {payment.patronDetails}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">
                          <div>{formatDate(payment.date)}</div>
                          {payment.paidAt && (
                            <div className="text-xs text-green-600">
                              Paid: {formatDateTime(payment.paidAt)}
                            </div>
                          )}
                        </TableCell>

                        <TableCell>
                          <Badge className={(
                            payment.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            payment.paymentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          )}>
                            {payment.paymentStatus}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm">
                          {payment.paymentMethod || 'N/A'}
                        </TableCell>

                        <TableCell className="text-sm font-mono">
                          {payment.paymentReference || 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}

                    {payments.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No payments found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="statistics" className="mt-6">
              {summary && (
                <div className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Transaction Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Transactions:</span>
                          <span className="font-bold">{summary.totalTransactions || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Loans:</span>
                          <span className="font-bold text-blue-600">{summary.activeLoans || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Overdue Items:</span>
                          <span className="font-bold text-red-600">{summary.overdueItems || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Returned Books:</span>
                          <span className="font-bold text-green-600">{summary.returnedBooks || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Fines Collected:</span>
                          <span className="font-bold text-purple-600">${(summary.totalFinesCollected || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Outstanding Fines:</span>
                          <span className="font-bold text-orange-600">${(summary.outstandingFines || 0).toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Payment Statistics</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Total Payments:</span>
                          <span className="font-bold">{summary.totalPayments || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paid Payments:</span>
                          <span className="font-bold text-green-600">{summary.paidPayments || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Pending Payments:</span>
                          <span className="font-bold text-yellow-600">{summary.pendingPayments || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Payment Amount:</span>
                          <span className="font-bold text-teal-600">${(summary.totalGeneralPayments || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Combined Records:</span>
                          <span className="font-bold">{summary.totalRecords || (summary.totalTransactions || 0) + (summary.totalPayments || 0)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={!pagination.hasPrev}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              Complete information about transaction #{selectedTransaction?.transactionId}
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Book Information</h3>
                  <div className="space-y-2">
                    <div><strong>Title:</strong> {selectedTransaction.item.title}</div>
                    <div><strong>Author:</strong> {selectedTransaction.item.author}</div>
                    <div><strong>ISBN:</strong> {selectedTransaction.item.isbn || 'N/A'}</div>
                    <div><strong>Type:</strong> {selectedTransaction.item.itemType}</div>
                    <div><strong>Subject:</strong> {selectedTransaction.item.subject || 'N/A'}</div>
                    <div><strong>Condition:</strong> {selectedTransaction.item.condition}</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Patron Information</h3>
                  <div className="space-y-2">
                    <div><strong>Name:</strong> {selectedTransaction.patronName}</div>
                    <div><strong>Email:</strong> {selectedTransaction.patron.patronEmail}</div>
                    <div><strong>Type:</strong> {selectedTransaction.patronType}</div>
                    <div><strong>Details:</strong> {selectedTransaction.patronDetails}</div>
                  </div>
                </div>
              </div>

              {/* Transaction Timeline */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Transaction Timeline</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Book Borrowed</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(selectedTransaction.borrowedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium">Due Date</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDateTime(selectedTransaction.dueDate)}
                      </div>
                    </div>
                  </div>

                  {selectedTransaction.returnedAt && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium">Book Returned</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(selectedTransaction.returnedAt)}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTransaction.status === 'overdue' && (
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <div>
                        <div className="font-medium text-red-600">Overdue</div>
                        <div className="text-sm text-red-600">
                          {selectedTransaction.daysOverdue} days overdue
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fine Information */}
              {(selectedTransaction.calculatedFine > 0 || selectedTransaction.finepayment.length > 0) && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Fine Information</h3>
                  <div className="space-y-3">
                    <div className="grid gap-2 md:grid-cols-3">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="text-2xl font-bold">${selectedTransaction.calculatedFine.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">Total Fine</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-600">
                          ${selectedTransaction.totalFinePaid.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Paid</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          ${selectedTransaction.outstandingFine.toFixed(2)}
                        </div>
                        <div className="text-sm text-muted-foreground">Outstanding</div>
                      </div>
                    </div>

                    {/* Payment History */}
                    {selectedTransaction.finepayment.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Payment History</h4>
                        <div className="space-y-2">
                          {selectedTransaction.finepayment.map((payment, index) => (
                            <div key={payment.paymentId} className="flex items-center justify-between p-2 bg-green-50 rounded">
                              <div>
                                <div className="font-medium">${payment.amount.toFixed(2)}</div>
                                <div className="text-sm text-muted-foreground">
                                  {formatDateTime(payment.paidAt)}
                                </div>
                              </div>
                              <div className="text-sm">
                                {payment.paymentMethod}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Additional Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <div><strong>Renewals Used:</strong> {selectedTransaction.renewalCount || 0}</div>
                    <div>
                      <strong>Status:</strong> 
                      <Badge className={`ml-2 ${getStatusColor(selectedTransaction.status)}`}>
                        {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedTransaction.rating && (
                    <div className="space-y-2">
                      <div><strong>Rating:</strong> {selectedTransaction.rating}/5 ⭐</div>
                      {selectedTransaction.review && (
                        <div>
                          <strong>Review:</strong>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded">
                            {selectedTransaction.review}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
