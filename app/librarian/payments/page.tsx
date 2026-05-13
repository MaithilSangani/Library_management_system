'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Textarea } from '@/app/components/ui/textarea';
import { Label } from '@/app/components/ui/label';
import { 
  CreditCard, 
  Search, 
  Filter, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Eye,
  Check,
  X,
  User,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';

interface Payment {
  paymentId: number;
  amount: number;
  paymentType: string;
  description?: string;
  paymentStatus: string;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  createdAt: string;
  isOverdue?: boolean;
  patron: {
    patronId: number;
    patronFirstName: string;
    patronLastName: string;
    patronEmail: string;
    isStudent: boolean;
    isFaculty: boolean;
  };
  transaction?: {
    transactionId: number;
    item: {
      title: string;
      author: string;
      itemType: string;
    };
  };
}

interface PaymentStats {
  totalPayments: number;
  pendingCount: number;
  pendingAmount: number;
  paidAmount: number;
  overdueCount: number;
}

export default function LibrarianPaymentsPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'cancel'>('confirm');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, typeFilter, searchTerm, currentPage]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('paymentType', typeFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const response = await fetch(`/api/librarian/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments);
        setStats(data.stats);
      } else {
        toast.error('Failed to load payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentAction = async () => {
    if (!selectedPayment || !user?.librarianEmail) {
      toast.error('Please log in as a librarian');
      return;
    }

    setProcessing(prev => new Set([...prev, selectedPayment.paymentId]));

    try {
      const response = await fetch('/api/librarian/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: selectedPayment.paymentId,
          paymentStatus: actionType === 'confirm' ? 'PAID' : 'CANCELLED',
          notes: notes.trim() || undefined,
          librarianEmail: user.librarianEmail
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Payment ${actionType === 'confirm' ? 'confirmed' : 'cancelled'} successfully`);
        setIsActionDialogOpen(false);
        setSelectedPayment(null);
        setNotes('');
        fetchPayments();
      } else {
        toast.error(result.error || 'Failed to update payment');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      toast.error('Error updating payment');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedPayment.paymentId);
        return newSet;
      });
    }
  };

  const openActionDialog = (payment: Payment, action: 'confirm' | 'cancel') => {
    setSelectedPayment(payment);
    setActionType(action);
    setNotes('');
    setIsActionDialogOpen(true);
  };

  const getStatusColor = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return 'bg-red-100 text-red-800';
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'MEMBERSHIP_FEE': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING_FEE': return 'bg-green-100 text-green-800';
      case 'LATE_FEE': return 'bg-yellow-100 text-yellow-800';
      case 'FINE': return 'bg-red-100 text-red-800';
      case 'DAMAGE_FEE': return 'bg-orange-100 text-orange-800';
      case 'LOST_BOOK_FEE': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && payments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
          <p className="text-muted-foreground">Manage all patron payments and transactions</p>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payment Management</h1>
        <p className="text-muted-foreground">
          Manage all patron payments and transactions
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.pendingAmount)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdueCount}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(stats.paidAmount)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patrons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Payment Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="MEMBERSHIP_FEE">Membership Fee</SelectItem>
                <SelectItem value="PROCESSING_FEE">Processing Fee</SelectItem>
                <SelectItem value="LATE_FEE">Late Fee</SelectItem>
                <SelectItem value="FINE">Fine</SelectItem>
                <SelectItem value="DAMAGE_FEE">Damage Fee</SelectItem>
                <SelectItem value="LOST_BOOK_FEE">Lost Book Fee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            All patron payments and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patron</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.paymentId}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {payment.patron.patronFirstName} {payment.patron.patronLastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.patron.patronEmail}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {payment.patron.isStudent && (
                              <Badge variant="outline" className="text-xs">Student</Badge>
                            )}
                            {payment.patron.isFaculty && (
                              <Badge variant="outline" className="text-xs">Faculty</Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeColor(payment.paymentType)}>
                          {payment.paymentType.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.paymentStatus, payment.isOverdue)}>
                          {payment.isOverdue ? 'OVERDUE' : payment.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(payment.createdAt)}</TableCell>
                      <TableCell>
                        {payment.dueDate ? formatDate(payment.dueDate) : '-'}
                      </TableCell>
                      <TableCell>
                        {payment.paymentStatus === 'PENDING' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => openActionDialog(payment, 'confirm')}
                              disabled={processing.has(payment.paymentId)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openActionDialog(payment, 'cancel')}
                              disabled={processing.has(payment.paymentId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No payments found</p>
              <p className="text-muted-foreground">
                No payments match your current filters
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'confirm' ? 'Confirm Payment' : 'Cancel Payment'}
            </DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  {actionType === 'confirm' 
                    ? `Confirm payment of ${formatCurrency(selectedPayment.amount)} from ${selectedPayment.patron.patronFirstName} ${selectedPayment.patron.patronLastName}`
                    : `Cancel payment of ${formatCurrency(selectedPayment.amount)} from ${selectedPayment.patron.patronFirstName} ${selectedPayment.patron.patronLastName}`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this payment action..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsActionDialogOpen(false)}
              disabled={selectedPayment && processing.has(selectedPayment.paymentId)}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'confirm' ? 'default' : 'destructive'}
              onClick={handlePaymentAction}
              disabled={selectedPayment && processing.has(selectedPayment.paymentId)}
            >
              {selectedPayment && processing.has(selectedPayment.paymentId) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                actionType === 'confirm' ? 'Confirm Payment' : 'Cancel Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
