'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { 
  Bell, 
  Check, 
  X, 
  BookOpen, 
  CheckCircle, 
  XCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Notification {
  notificationId: number;
  type: string;
  status: string;
  title: string;
  message: string;
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (user && (user.role === 'PATRON' || user.role === 'LIBRARIAN')) {
      // Add slight delay to ensure user context is fully loaded
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 500);
      
      // Refresh notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const recipientId = user.role === 'PATRON' ? user.patronId : user.librarianId;
      const recipientType = user.role === 'PATRON' ? 'PATRON' : 'LIBRARIAN';
      
      // Exit early if no recipientId to prevent failed fetch
      if (!recipientId) {
        console.log('No recipient ID available yet, skipping notifications fetch');
        setLoading(false);
        return;
      }
      
      const params = new URLSearchParams({
        recipientId: recipientId.toString(),
        recipientType,
        limit: '5' // Show only latest 5 notifications in the bell
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`/api/notifications?${params}`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data: NotificationsResponse = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        console.warn('Failed to fetch notifications:', response.status);
        // Don't show error to user, just fail silently
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Notifications fetch was aborted (timeout)');
      } else {
        console.error('Error fetching notifications:', error);
      }
      // Set empty defaults on error
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationIds: [notificationId]
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.notificationId === notificationId 
              ? { ...notif, status: 'READ', readAt: new Date().toISOString() }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const recipientId = user.role === 'PATRON' ? user.patronId : user.librarianId;
      const recipientType = user.role === 'PATRON' ? 'PATRON' : 'LIBRARIAN';

      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          markAllAsRead: true,
          recipientId,
          recipientType
        })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            status: 'READ', 
            readAt: new Date().toISOString() 
          }))
        );
        setUnreadCount(0);
        toast.success('All notifications marked as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Error updating notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'BORROW_REQUEST': return Clock;
      case 'BORROW_APPROVED': return CheckCircle;
      case 'BORROW_REJECTED': return XCircle;
      case 'BOOK_OVERDUE': return AlertCircle;
      case 'FINE_NOTICE': return DollarSign;
      default: return Bell;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'BORROW_REQUEST': return 'text-blue-500';
      case 'BORROW_APPROVED': return 'text-green-500';
      case 'BORROW_REJECTED': return 'text-red-500';
      case 'BOOK_OVERDUE': return 'text-orange-500';
      case 'FINE_NOTICE': return 'text-yellow-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleAcceptRequest = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click
    
    if (!user || !user.librarianEmail || !notification.relatedId) {
      toast.error('Unable to process request');
      return;
    }

    setProcessingRequests(prev => new Set([...prev, notification.relatedId!]));

    try {
      const response = await fetch('/api/librarian/borrow-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: notification.relatedId,
          action: 'approve',
          librarianEmail: user.librarianEmail
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Request approved! Book has been added to patron\'s library.');
        
        // Remove this notification from the list since it's been processed
        setNotifications(prev => prev.filter(n => n.notificationId !== notification.notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh notifications to get any new ones
        setTimeout(fetchNotifications, 1000);
      } else {
        toast.error(result.error || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Error processing request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.relatedId!);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (notification: Notification, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent notification click
    
    if (!user || !user.librarianEmail || !notification.relatedId) {
      toast.error('Unable to process request');
      return;
    }

    const rejectionReason = 'Book is currently unavailable or already borrowed by another patron.';
    
    setProcessingRequests(prev => new Set([...prev, notification.relatedId!]));

    try {
      const response = await fetch('/api/librarian/borrow-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId: notification.relatedId,
          action: 'reject',
          librarianEmail: user.librarianEmail,
          rejectionReason: rejectionReason
        })
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Request rejected. Patron has been notified.');
        
        // Remove this notification from the list since it's been processed
        setNotifications(prev => prev.filter(n => n.notificationId !== notification.notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Refresh notifications to get any new ones
        setTimeout(fetchNotifications, 1000);
      } else {
        toast.error(result.error || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Error processing request');
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.relatedId!);
        return newSet;
      });
    }
  };

  if (!user || (user.role !== 'PATRON' && user.role !== 'LIBRARIAN')) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length > 0 ? (
                <div className="space-y-0">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const isUnread = notification.status === 'UNREAD';
                    
                    return (
                      <div
                        key={notification.notificationId}
                        className={`p-4 border-b border-gray-100 ${
                          isUnread ? 'bg-blue-50 cursor-pointer hover:bg-blue-100' : ''
                        }`}
                        onClick={() => {
                          if (isUnread) {
                            markAsRead(notification.notificationId);
                          }
                          // If librarian clicks a borrow request notification, redirect to borrow requests page
                          if (user?.role === 'LIBRARIAN' && notification.type === 'BORROW_REQUEST') {
                            setIsOpen(false);
                            router.push('/librarian/borrow-requests');
                          }
                        }}
                      >
                        <div className="flex gap-3">
                          <div className={`flex-shrink-0 ${getNotificationColor(notification.type)}`}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-600'}`}>
                                {notification.title}
                              </p>
                              {isUnread && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                            
                            {/* Action buttons for borrow requests (librarians only) */}
                            {user.role === 'LIBRARIAN' && 
                             notification.type === 'BORROW_REQUEST' && 
                             notification.status === 'UNREAD' && 
                             notification.relatedId && (
                              <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={(e) => handleAcceptRequest(notification, e)}
                                  disabled={processingRequests.has(notification.relatedId!)}
                                  className="flex-1 h-7 text-xs bg-green-600 hover:bg-green-700"
                                >
                                  {processingRequests.has(notification.relatedId!) ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="mr-1 h-3 w-3" />
                                      Accept
                                    </>
                                  )}
                                </Button>
                                
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => handleRejectRequest(notification, e)}
                                  disabled={processingRequests.has(notification.relatedId!)}
                                  className="flex-1 h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  {processingRequests.has(notification.relatedId!) ? (
                                    <>
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <X className="mr-1 h-3 w-3" />
                                      Reject
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </ScrollArea>
            
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-100">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-center text-xs"
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to full notifications page (you can create this later)
                    // router.push(user.role === 'PATRON' ? '/patron/notifications' : '/librarian/notifications');
                  }}
                >
                  View all notifications
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}
