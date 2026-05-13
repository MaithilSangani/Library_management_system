'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  BookOpen, 
  Loader2,
  Calendar,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';

interface Reservation {
  reservationId: number;
  reservedAt: string;
  daysAgo: number;
  status: 'ready' | 'pending' | 'waiting';
  expiresAt?: string;
  queuePosition?: number;
  item: {
    itemId: number;
    title: string;
    author: string;
    isbn?: string;
    itemType: string;
    availableCopies: number;
    totalCopies: number;
    imageUrl?: string;
  };
}

export default function PatronReservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    // Validate user and patron info
    const validateUserSession = () => {
      if (!user) {
        const storedUser = localStorage.getItem('auth-user');
        if (storedUser) {
          try {
            return JSON.parse(storedUser);
          } catch (error) {
            console.error('Failed to parse stored user:', error);
            localStorage.removeItem('auth-user');
          }
        }
        return null;
      }
      return user;
    };

    const validatedUser = validateUserSession();
    
    if (!validatedUser?.patronId) {
      toast.error('Please log in to view reservations');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/patron/reservations?patronId=${validatedUser.patronId}`);
      if (response.ok) {
        const data = await response.json();
        setReservations(data);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      toast.error('Error loading reservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: number) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      setCancellingId(reservationId);
      const response = await fetch(`/api/patron/reservations/${reservationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast.success('Reservation cancelled successfully!');
        fetchReservations();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to cancel reservation');
      }
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      toast.error('Error cancelling reservation');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ready': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'waiting': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'waiting': return <Users className="h-4 w-4 text-blue-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your reservations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Reservations</h1>
        <p className="text-muted-foreground">
          Manage your book reservations and pickup notifications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reservations</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reservations.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready for Pickup</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reservations.filter(r => r.status === 'ready').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Queue</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {reservations.filter(r => r.status === 'waiting').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ready for Pickup Alert */}
      {reservations.some(r => r.status === 'ready') && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You have {reservations.filter(r => r.status === 'ready').length} book(s) ready for pickup! 
            Please collect them from the library circulation desk.
          </AlertDescription>
        </Alert>
      )}

      {/* Reservations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Reservations</CardTitle>
          <CardDescription>
            Track the status of your book reservations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reservations.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reservations</h3>
              <p className="text-gray-500 mb-4">You haven't reserved any books yet.</p>
              <Button asChild>
                <a href="/patron/browse">Browse Catalog</a>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reserved Date</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((reservation) => (
                  <TableRow key={reservation.reservationId}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="relative w-12 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {reservation.item.imageUrl ? (
                            <Image
                              src={reservation.item.imageUrl}
                              alt={reservation.item.title}
                              fill
                              className="object-contain p-1"
                              unoptimized={true}
                            />
                          ) : (
                            <BookOpen className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{reservation.item.title}</div>
                          <div className="text-sm text-muted-foreground">
                            by {reservation.item.author}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.item.isbn || 'No ISBN'} • {reservation.item.itemType}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(reservation.status)}
                        <Badge className={getStatusBadgeColor(reservation.status)}>
                          {reservation.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{formatDate(reservation.reservedAt)}</div>
                        <div className="text-xs text-muted-foreground">
                          {reservation.daysAgo} days ago
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {reservation.status === 'ready' && reservation.expiresAt && (
                        <div>
                          <div className="text-sm font-medium text-green-700">Ready to collect!</div>
                          <div className="text-xs text-muted-foreground">
                            Expires: {formatDateTime(reservation.expiresAt)}
                            <br />
                            {getDaysUntilExpiry(reservation.expiresAt) > 0 ? (
                              <span className="text-green-600">
                                {getDaysUntilExpiry(reservation.expiresAt)} days left
                              </span>
                            ) : (
                              <span className="text-red-600">
                                Expired
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {reservation.status === 'waiting' && reservation.queuePosition && (
                        <div>
                          <div className="text-sm font-medium text-blue-700">
                            Position {reservation.queuePosition} in queue
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {reservation.item.availableCopies} of {reservation.item.totalCopies} available
                          </div>
                        </div>
                      )}
                      {reservation.status === 'pending' && (
                        <div>
                          <div className="text-sm font-medium text-yellow-700">Being processed</div>
                          <div className="text-xs text-muted-foreground">
                            You'll be notified when ready
                          </div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelReservation(reservation.reservationId)}
                        disabled={cancellingId === reservation.reservationId}
                      >
                        {cancellingId === reservation.reservationId ? (
                          <>
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                            Cancelling
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-4 w-4" />
                            Cancel
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Reservation Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span><strong>Ready:</strong> Your book is available for pickup at the circulation desk</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span><strong>Pending:</strong> Your reservation is being processed</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span><strong>Waiting:</strong> You're in the queue waiting for the book to become available</span>
            </div>
          </div>
          <div className="pt-2 text-xs text-muted-foreground border-t">
            <p>• Ready reservations must be collected within 7 days or they will be cancelled</p>
            <p>• You will receive email notifications when your reservations are ready for pickup</p>
            <p>• Maximum 5 active reservations per patron</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
