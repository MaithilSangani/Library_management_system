'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  CreditCard, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Receipt,
  Loader2,
  Book,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Wallet
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';

interface Payment {
  paymentId: number;
  amount: number;
  paymentType: string;
  description?: string;
  paymentStatus: string;
  dueDate?: string;
  paidDate?: string;
  paymentMethod?: string;
  referenceNumber?: string;
  createdAt: string;
  isOverdue?: boolean;
  daysOverdue?: number;
  transaction?: {
    transactionId: number;
    borrowedAt: string;
    dueDate: string;
    item: {
      title: string;
      author: string;
      itemType: string;
    }
  };
}

interface PaymentData {
  payments: Payment[];
  pendingPayments: Payment[];
  overduePayments: Payment[];
  paidPayments: Payment[];
  stats: {
    totalAmount: number;
    statusBreakdown: {
      [key: string]: {
        count: number;
        amount: number;
      }
    }
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function PaymentsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState<Set<number>>(new Set());
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  
  // New payment form states
  const [isNewPaymentDialogOpen, setIsNewPaymentDialogOpen] = useState(false);
  const [suggestedFees, setSuggestedFees] = useState<any>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    paymentType: '',
    amount: '',
    description: '',
    dueDate: ''
  });
  const [creatingPayment, setCreatingPayment] = useState(false);

  useEffect(() => {
    if (user?.patronId) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      
      if (!user?.patronId) {
        console.error('No patron ID available');
        return;
      }

      const response = await fetch(`/api/patron/payments?patronId=${user.patronId}`);
      
      if (response.ok) {
        const result: PaymentData = await response.json();
        setData(result);
      } else {
        toast.error('Failed to load payments');
        // Set empty data to stop loading
        setData({
          payments: [],
          pendingPayments: [],
          overduePayments: [],
          paidPayments: [],
          stats: {
            totalAmount: 0,
            statusBreakdown: {}
          },
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            pages: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error loading payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedPayment || !paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setProcessingPayment(prev => new Set([...prev, selectedPayment.paymentId]));
    
    try {
      const response = await fetch('/api/patron/payments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: selectedPayment.paymentId,
          paymentStatus: 'PAID',
          paymentMethod: paymentMethod,
          referenceNumber: referenceNumber.trim() || undefined
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success('Payment processed successfully!');
        setIsPaymentDialogOpen(false);
        setSelectedPayment(null);
        setPaymentMethod('');
        setReferenceNumber('');
        // Refresh the data
        fetchPayments();
      } else {
        toast.error(result.error || 'Failed to process payment');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error processing payment');
    } finally {
      setProcessingPayment(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedPayment.paymentId);
        return newSet;
      });
    }
  };

  const openPaymentDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setPaymentMethod('');
    setReferenceNumber('');
    setIsPaymentDialogOpen(true);
  };

  // New payment form functions
  const fetchSuggestedFees = async () => {
    if (!user?.patronId) return;
    
    try {
      setLoadingSuggestions(true);
      const response = await fetch(`/api/patron/fees?patronId=${user.patronId}`);
      if (response.ok) {
        const result = await response.json();
        setSuggestedFees(result);
      }
    } catch (error) {
      console.error('Error fetching suggested fees:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const openNewPaymentDialog = () => {
    setNewPaymentForm({
      paymentType: '',
      amount: '',
      description: '',
      dueDate: ''
    });
    setIsNewPaymentDialogOpen(true);
    fetchSuggestedFees();
  };

  const handlePaymentTypeChange = (type: string) => {
    setNewPaymentForm(prev => ({ ...prev, paymentType: type }));
    
    if (suggestedFees && suggestedFees.suggestedFees[type]) {
      const suggestion = suggestedFees.suggestedFees[type];
      let amount = '';
      
      switch (type) {
        case 'MEMBERSHIP_FEE':
          amount = (suggestedFees.patron.isStudent ? suggestion.student : suggestion.faculty).toString();
          break;
        case 'PROCESSING_FEE':
          amount = suggestion.standard.toString();
          break;
        case 'DAMAGE_FEE':
          amount = suggestion.moderate.toString();
          break;
        case 'LOST_BOOK_FEE':
          amount = suggestion.standard.toString();
          break;
        case 'FINE':
          amount = suggestion.standard.toString();
          break;
        default:
          amount = '10.00';
      }
      
      setNewPaymentForm(prev => ({
        ...prev,
        amount,
        description: suggestion.description
      }));
    }
  };

  const createNewPayment = async () => {
    if (!newPaymentForm.paymentType || !newPaymentForm.amount) {
      toast.error('Please fill in required fields');
      return;
    }

    if (!user?.patronId) {
      toast.error('Please log in to create a payment');
      return;
    }

    setCreatingPayment(true);

    try {
      const response = await fetch('/api/patron/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patronId: user.patronId,
          paymentType: newPaymentForm.paymentType,
          amount: parseFloat(newPaymentForm.amount),
          description: newPaymentForm.description || undefined,
          dueDate: newPaymentForm.dueDate || undefined
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Payment request created successfully!');
        setIsNewPaymentDialogOpen(false);
        fetchPayments();
      } else {
        toast.error(result.error || 'Failed to create payment');
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Error creating payment');
    } finally {
      setCreatingPayment(false);
    }
  };

  const getPaymentTypeColor = (type: string) => {
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

  const getStatusColor = (status: string, isOverdue?: boolean) => {
    if (isOverdue) return 'bg-red-100 text-red-800 border-red-200';
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const PaymentRow = ({ payment }: { payment: Payment }) => {
    const isProcessing = processingPayment.has(payment.paymentId);
    
    return (
      <TableRow key={payment.paymentId}>
        <TableCell>
          <div className="font-medium">{payment.description || payment.paymentType.replace('_', ' ')}</div>
          <div className="text-sm text-muted-foreground">
            {payment.transaction ? (
              <span>
                Book: {payment.transaction.item.title}
                <br />
                <span className="text-xs">Transaction #{payment.transaction.transactionId}</span>
              </span>
            ) : (
              <span>General payment</span>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Badge className={getPaymentTypeColor(payment.paymentType)}>
            {payment.paymentType.replace('_', ' ')}
          </Badge>
        </TableCell>
        <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
        <TableCell>
          <Badge className={getStatusColor(payment.paymentStatus, payment.isOverdue)}>
            {payment.isOverdue ? 'OVERDUE' : payment.paymentStatus}
            {payment.isOverdue && payment.daysOverdue && (
              <span className="ml-1">({payment.daysOverdue}d)</span>
            )}
          </Badge>
        </TableCell>
        <TableCell>
          {payment.dueDate ? formatDate(payment.dueDate) : 'No due date'}
        </TableCell>
        <TableCell>
          {payment.paidDate ? formatDate(payment.paidDate) : '-'}
        </TableCell>
        <TableCell>
          {payment.paymentStatus === 'PENDING' && (
            <Button
              size="sm"
              onClick={() => openPaymentDialog(payment)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay Now
                </>
              )}
            </Button>
          )}
          {payment.paymentStatus === 'PAID' && payment.paymentMethod && (
            <div className="text-sm">
              <div className="font-medium">{payment.paymentMethod}</div>
              {payment.referenceNumber && (
                <div className="text-muted-foreground">Ref: {payment.referenceNumber}</div>
              )}
            </div>
          )}
        </TableCell>
      </TableRow>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage your payments and fees</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 flex items-center justify-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage your payments and fees</p>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Unable to load payment data</p>
            <p className="text-muted-foreground">Please try refreshing the page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingAmount = data.stats.statusBreakdown.PENDING?.amount || 0;
  const paidAmount = data.stats.statusBreakdown.PAID?.amount || 0;
  const overdueAmount = data.overduePayments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments</h1>
        <p className="text-muted-foreground">
          Manage your payments and library fees
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingPayments.length} pending payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {data.overduePayments.length} overdue payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</div>
            <p className="text-xs text-muted-foreground">
              {data.paidPayments.length} completed payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Payment Management</h2>
        <Button onClick={openNewPaymentDialog} className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          New Payment
        </Button>
      </div>

      {/* Payments Table */}
      <Tabs defaultValue="pending">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Pending ({data.pendingPayments.length})
          </TabsTrigger>
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Overdue ({data.overduePayments.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            History ({data.paidPayments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>
                Outstanding payments that require your attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.pendingPayments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.pendingPayments.map(payment => (
                        <PaymentRow key={payment.paymentId} payment={payment} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No pending payments</p>
                  <p className="text-muted-foreground">You're all caught up!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Overdue Payments
              </CardTitle>
              <CardDescription>
                Payments that are past their due date and need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.overduePayments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Days Overdue</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.overduePayments.map(payment => (
                        <PaymentRow key={payment.paymentId} payment={payment} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                  <p className="text-lg font-medium">No overdue payments</p>
                  <p className="text-muted-foreground">Great job staying current!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>
                Your completed payment transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.paidPayments.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Paid Date</TableHead>
                        <TableHead>Payment Method</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.paidPayments.map(payment => (
                        <PaymentRow key={payment.paymentId} payment={payment} />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No payment history</p>
                  <p className="text-muted-foreground">Your completed payments will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              {selectedPayment && (
                <>
                  Complete payment for {selectedPayment.description || selectedPayment.paymentType} 
                  - {formatCurrency(selectedPayment.amount)}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Debit Card">Debit Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Check">Check</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="referenceNumber">Reference Number (Optional)</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Transaction/Reference number"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              disabled={selectedPayment && processingPayment.has(selectedPayment.paymentId)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={!paymentMethod || (selectedPayment && processingPayment.has(selectedPayment.paymentId))}
            >
              {selectedPayment && processingPayment.has(selectedPayment.paymentId) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Pay {selectedPayment ? formatCurrency(selectedPayment.amount) : ''}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Payment Dialog */}
      <Dialog open={isNewPaymentDialogOpen} onOpenChange={setIsNewPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Payment</DialogTitle>
            <DialogDescription>
              Request a new payment for library fees and services
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Suggested Fees Section */}
            {loadingSuggestions && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Loading suggested fees...</span>
              </div>
            )}

            {suggestedFees && !loadingSuggestions && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-muted-foreground">Suggested Fees for You</h4>
                
                {/* Overdue Fees */}
                {suggestedFees.overdueBooks && suggestedFees.overdueBooks.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <span className="font-medium text-red-800">Outstanding Late Fees</span>
                    </div>
                    <p className="text-sm text-red-700 mb-3">
                      You have {suggestedFees.overdueBooks.length} overdue books. Consider paying late fees.
                    </p>
                    <div className="space-y-1">
                      {suggestedFees.overdueBooks.slice(0, 3).map((book: any, index: number) => (
                        <div key={index} className="text-xs text-red-600">
                          • {book.title} (Due: {new Date(book.dueDate).toLocaleDateString()}, ${book.suggestedFee} fee)
                        </div>
                      ))}
                      {suggestedFees.overdueBooks.length > 3 && (
                        <div className="text-xs text-red-600">• And {suggestedFees.overdueBooks.length - 3} more books</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Membership Status */}
                {suggestedFees.membershipStatus && (
                  <div className={`p-4 rounded-lg border ${
                    suggestedFees.membershipStatus.isExpiringSoon 
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="font-medium">
                        Membership {suggestedFees.membershipStatus.isExpiringSoon ? 'Renewal' : 'Status'}
                      </span>
                    </div>
                    <p className="text-sm mb-2">
                      {suggestedFees.membershipStatus.message}
                    </p>
                    {suggestedFees.membershipStatus.isExpiringSoon && (
                      <div className="text-xs text-muted-foreground">
                        Suggested fee: ${suggestedFees.patron.isStudent 
                          ? suggestedFees.suggestedFees.MEMBERSHIP_FEE?.student 
                          : suggestedFees.suggestedFees.MEMBERSHIP_FEE?.faculty} ({suggestedFees.patron.isStudent ? 'Student' : 'Faculty'})
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Payment Form */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select value={newPaymentForm.paymentType} onValueChange={handlePaymentTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBERSHIP_FEE">Membership Fee</SelectItem>
                    <SelectItem value="PROCESSING_FEE">Processing Fee</SelectItem>
                    <SelectItem value="LATE_FEE">Late Fee</SelectItem>
                    <SelectItem value="FINE">Fine</SelectItem>
                    <SelectItem value="DAMAGE_FEE">Damage Fee</SelectItem>
                    <SelectItem value="LOST_BOOK_FEE">Lost Book Fee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="amount">Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newPaymentForm.amount}
                  onChange={(e) => setNewPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newPaymentForm.description}
                  onChange={(e) => setNewPaymentForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this payment"
                  rows={3}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={newPaymentForm.dueDate}
                  onChange={(e) => setNewPaymentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Payment Preview */}
              {newPaymentForm.paymentType && newPaymentForm.amount && (
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Payment Preview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Type:</span>
                      <Badge className={getPaymentTypeColor(newPaymentForm.paymentType)}>
                        {newPaymentForm.paymentType.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">
                        {formatCurrency(parseFloat(newPaymentForm.amount) || 0)}
                      </span>
                    </div>
                    {newPaymentForm.dueDate && (
                      <div className="flex justify-between">
                        <span>Due Date:</span>
                        <span>{new Date(newPaymentForm.dueDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewPaymentDialogOpen(false)}
              disabled={creatingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={createNewPayment}
              disabled={!newPaymentForm.paymentType || !newPaymentForm.amount || creatingPayment}
            >
              {creatingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-4 w-4" />
                  Create Payment Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
