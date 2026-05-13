'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Calendar,
  Loader2,
  Filter,
  AlertCircle,
  Book
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';

interface BorrowRequest {
  requestId: number;
  status: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  rejectionReason?: string;
  expiresAt: string;
  patron: {
    patronId: number;
    patronFirstName: string;
    patronLastName: string;
    patronEmail: string;
    isStudent: boolean;
    isFaculty: boolean;
  };
  item: {
    itemId: number;
    title: string;
    author: string;
    isbn?: string;
    imageUrl?: string;
    availableCopies: number;
    totalCopies: number;
  };
}

interface BorrowRequestsResponse {
  requests: BorrowRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export default function BorrowRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<number>>(new Set());
  const [selectedStatus, setSelectedStatus] = useState('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 20, total: 0, pages: 0, hasNext: false, hasPrev: false
  });

  // Dialog states
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedRequestForRejection, setSelectedRequestForRejection] = useState<BorrowRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    console.log('🔄 Fetching borrow requests...', { selectedStatus, currentPage });
    fetchBorrowRequests();
  }, [selectedStatus, currentPage]);

  // Debug: Log user info
  useEffect(() => {
    console.log('👤 Current user:', user);
    if (user) {
      console.log('👤 User role:', user.role);
      console.log('👤 Librarian email:', user.librarianEmail);
    }
  }, [user]);

  const fetchBorrowRequests = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        status: selectedStatus,
        page: currentPage.toString(),
        limit: '10'
      });

      const url = `/api/librarian/borrow-requests?${params}`;
      console.log('🌐 Fetching from:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data: BorrowRequestsResponse = await response.json();
        console.log('📄 API Response:', {
          requestsCount: data.requests?.length || 0,
          totalRequests: data.pagination?.total || 0,
          currentPage: data.pagination?.page || 0
        });
        console.log('📋 Raw requests data:', data.requests);
        
        setRequests(data.requests || []);
        setPagination(data.pagination || {
          page: 1, limit: 10, total: 0, pages: 0, hasNext: false, hasPrev: false
        });
        
        if (!data.requests || data.requests.length === 0) {
          console.log('⚠️ No requests returned from API');
          if (selectedStatus === 'PENDING') {
            console.log('💡 Try checking if there are any pending requests in the database');
          }
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        toast.error(`Failed to load borrow requests: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Network/Parse Error:', error);
      toast.error(`Error loading borrow requests: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: BorrowRequest) => {
    console.log('handleApprove called', { user, request });
    
    if (!user) {
      console.error('No user found');
      toast.error('Please log in');
      return;
    }
    
    if (!user.librarianEmail) {
      console.error('No librarianEmail found in user:', user);
      toast.error('Please log in as a librarian');
      return;
    }
    
    console.log('Proceeding with approve request...');

    setProcessing(prev => new Set([...prev, request.requestId]));

    try {
      const response = await fetch('/api/librarian/borrow-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: request.requestId,
          action: 'approve',
          librarianEmail: user.librarianEmail
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Request approved! Book "${request.item.title}" has been added to ${request.patron.patronFirstName}'s borrowed books.`);
        await fetchBorrowRequests(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error approving request');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(request.requestId);
        return newSet;
      });
    }
  };

  const handleReject = async () => {
    if (!selectedRequestForRejection || !user || !user.librarianEmail) {
      toast.error('Please log in as a librarian');
      return;
    }

    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(prev => new Set([...prev, selectedRequestForRejection.requestId]));

    try {
      const response = await fetch('/api/librarian/borrow-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: selectedRequestForRejection.requestId,
          action: 'reject',
          librarianEmail: user.librarianEmail,
          rejectionReason: rejectionReason.trim()
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(`Request rejected. ${selectedRequestForRejection.patron.patronFirstName} has been notified.`);
        setIsRejectDialogOpen(false);
        setSelectedRequestForRejection(null);
        setRejectionReason('');
        await fetchBorrowRequests(); // Refresh the list
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error rejecting request');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedRequestForRejection.requestId);
        return newSet;
      });
    }
  };

  const openRejectDialog = (request: BorrowRequest) => {
    setSelectedRequestForRejection(request);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'EXPIRED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const RequestCard = ({ request }: { request: BorrowRequest }) => {
    const isProcessing = processing.has(request.requestId);
    const expired = isExpired(request.expiresAt);

    return (
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {request.item.title}
                {expired && request.status === 'PENDING' && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Expired
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>by {request.item.author}</CardDescription>
            </div>
            <Badge className={getStatusColor(request.status)}>
              {request.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            {/* Book Image */}
            <div className="w-20 h-28 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
              {request.item.imageUrl ? (
                <Image
                  src={request.item.imageUrl}
                  alt={request.item.title}
                  width={80}
                  height={112}
                  className="object-cover rounded"
                />
              ) : (
                <Book className="h-8 w-8 text-gray-400" />
              )}
            </div>

            {/* Request Details */}
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patron Details
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {request.patron.patronFirstName} {request.patron.patronLastName}
                  </p>
                  <p className="text-sm text-muted-foreground">{request.patron.patronEmail}</p>
                  <div className="flex gap-2 mt-1">
                    {request.patron.isStudent && (
                      <Badge variant="outline" className="text-xs">Student</Badge>
                    )}
                    {request.patron.isFaculty && (
                      <Badge variant="outline" className="text-xs">Faculty</Badge>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Request Timeline
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Requested: {formatDate(request.requestedAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Expires: {formatDate(request.expiresAt)}
                  </p>
                  {request.processedAt && (
                    <p className="text-sm text-muted-foreground">
                      Processed: {formatDate(request.processedAt)}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium">Book Availability</h4>
                <p className="text-sm text-muted-foreground">
                  Available: {request.item.availableCopies} / {request.item.totalCopies} copies
                </p>
                {request.item.isbn && (
                  <p className="text-sm text-muted-foreground">ISBN: {request.item.isbn}</p>
                )}
              </div>

              {request.notes && (
                <div>
                  <h4 className="font-medium">Patron Notes</h4>
                  <p className="text-sm text-muted-foreground bg-gray-50 p-2 rounded">
                    {request.notes}
                  </p>
                </div>
              )}

              {request.rejectionReason && (
                <div>
                  <h4 className="font-medium">Rejection Reason</h4>
                  <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    {request.rejectionReason}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Processed by: {request.processedBy}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              {request.status === 'PENDING' && !expired && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleApprove(request)}
                    disabled={isProcessing || request.item.availableCopies <= 0}
                    size="sm"
                    className="flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => openRejectDialog(request)}
                    disabled={isProcessing}
                    size="sm"
                    className="flex-1"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Borrow Requests</h1>
        <p className="text-muted-foreground">
          Review and manage patron borrow requests
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <label className="text-sm font-medium">Status:</label>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="ALL">All Status</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-4 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔧 Manual API test triggered');
                  fetchBorrowRequests();
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                ) : (
                  '🔧'
                )}
                Test API
              </Button>
              <div className="text-sm text-muted-foreground">
                {pagination.total} total requests
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="h-48">
                <CardContent className="p-6 flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length > 0 ? (
          <>
            <div className="space-y-4">
              {requests.map((request) => (
                <RequestCard key={request.requestId} request={request} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={!pagination.hasPrev || loading}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={!pagination.hasNext || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No borrow requests found</p>
              <p className="text-muted-foreground">
                {selectedStatus === 'PENDING' 
                  ? "There are no pending requests at the moment." 
                  : `No ${selectedStatus.toLowerCase()} requests found.`
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Borrow Request</DialogTitle>
            <DialogDescription>
              {selectedRequestForRejection && (
                <>
                  You are about to reject {selectedRequestForRejection.patron.patronFirstName} {selectedRequestForRejection.patron.patronLastName}'s 
                  request to borrow "{selectedRequestForRejection.item.title}". 
                  Please provide a reason for rejection.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason</label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please explain why this request is being rejected..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
              disabled={selectedRequestForRejection && processing.has(selectedRequestForRejection.requestId)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!rejectionReason.trim() || (selectedRequestForRejection && processing.has(selectedRequestForRejection.requestId))}
            >
              {selectedRequestForRejection && processing.has(selectedRequestForRejection.requestId) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
