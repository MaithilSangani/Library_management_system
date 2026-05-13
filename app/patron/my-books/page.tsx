'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Progress } from '@/app/components/ui/progress';
import { 
  Book, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  CheckCircle,
  BookOpen,
  Loader2,
  TrendingUp,
  Award
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';

interface BorrowedBook {
  transactionId: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  isReturned: boolean;
  status: 'active' | 'returned' | 'overdue';
  daysOverdue: number;
  fine: number;
  item: {
    itemId: number;
    title: string;
    author: string;
    isbn?: string;
    subject?: string;
    itemType: string;
    condition: string;
    imageUrl?: string;
  };
}

interface PatronStats {
  totalBorrowed: number;
  overdueBooks: number;
  totalFines: number;
  booksRead: number;
  currentBorrowingLimit: number;
}

interface MyBooksData {
  currentLoans: BorrowedBook[];
  history: BorrowedBook[];
  stats: PatronStats;
  success: boolean;
}

export default function MyBooks() {
  const { user } = useAuth();
  const [data, setData] = useState<MyBooksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [renewingBooks, setRenewingBooks] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    console.log('🔄 [MY BOOKS DEBUG] useEffect triggered');
    console.log('🔄 [MY BOOKS DEBUG] User in useEffect:', user);
    console.log('🔄 [MY BOOKS DEBUG] User patronId:', user?.patronId);
    
    if (user?.patronId) {
      console.log('✅ [MY BOOKS DEBUG] User has patronId, calling fetchMyBooks()');
      fetchMyBooks();
    } else if (user && !user.patronId) {
      // User is logged in but doesn't have a patron ID
      console.error('❌ [MY BOOKS DEBUG] User logged in but no patron ID found:', user);
      console.log('📝 [MY BOOKS DEBUG] Setting empty data due to missing patronId...');
      setLoading(false);
      setData({
        currentLoans: [],
        history: [],
        stats: {
          totalBorrowed: 0,
          overdueBooks: 0,
          totalFines: 0,
          booksRead: 0,
          currentBorrowingLimit: 5
        },
        success: false
      });
    } else {
      console.log('⏳ [MY BOOKS DEBUG] User not ready yet or not logged in');
    }
  }, [user]);

  const fetchMyBooks = async (includeHistory = false) => {
    try {
      setLoading(true);
      console.log('📚 [MY BOOKS DEBUG] Starting fetchMyBooks...');
      console.log('📚 [MY BOOKS DEBUG] User object:', user);
      console.log('📚 [MY BOOKS DEBUG] User patronId:', user?.patronId);
      console.log('📚 [MY BOOKS DEBUG] Include history:', includeHistory);
      
      if (!user?.patronId) {
        console.error('❌ [MY BOOKS DEBUG] No patron ID available in user object');
        console.log('📚 [MY BOOKS DEBUG] Setting empty data and returning...');
        setData({
          currentLoans: [],
          history: [],
          stats: {
            totalBorrowed: 0,
            overdueBooks: 0,
            totalFines: 0,
            booksRead: 0,
            currentBorrowingLimit: 5
          },
          success: true
        });
        return;
      }

      const params = new URLSearchParams({
        patronId: user.patronId.toString(),
      });
      
      if (includeHistory) {
        params.append('includeHistory', 'true');
      }

      const apiUrl = `/api/patron/books?${params}`;
      console.log('🌐 [MY BOOKS DEBUG] Making API call to:', apiUrl);
      
      const response = await fetch(apiUrl);
      console.log('📡 [MY BOOKS DEBUG] Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const result: MyBooksData = await response.json();
        console.log('✅ [MY BOOKS DEBUG] API response received:', result);
        console.log('📊 [MY BOOKS DEBUG] Current loans count:', result.currentLoans?.length || 0);
        console.log('📊 [MY BOOKS DEBUG] History count:', result.history?.length || 0);
        console.log('📊 [MY BOOKS DEBUG] Stats:', result.stats);
        
        if (result.currentLoans && result.currentLoans.length > 0) {
          console.log('📚 [MY BOOKS DEBUG] Current loans details:');
          result.currentLoans.forEach((loan, index) => {
            console.log(`   ${index + 1}. "${loan.item.title}" by ${loan.item.author}`);
            console.log(`      Status: ${loan.status}, Due: ${loan.dueDate}`);
            console.log(`      Transaction ID: ${loan.transactionId}`);
          });
        } else {
          console.log('⚠️ [MY BOOKS DEBUG] No current loans in API response!');
        }
        
        console.log('📝 [MY BOOKS DEBUG] Setting data state...');
        setData(result);
        console.log('✅ [MY BOOKS DEBUG] Data state updated successfully');
      } else {
        const errorText = await response.text();
        console.error('❌ [MY BOOKS DEBUG] API error response:', errorText);
        console.error('❌ [MY BOOKS DEBUG] Response status:', response.status, response.statusText);
        toast.error(`Failed to load your books: ${response.status} ${response.statusText}`);
        
        // Set empty data to stop loading
        console.log('📝 [MY BOOKS DEBUG] Setting empty data due to API error...');
        setData({
          currentLoans: [],
          history: [],
          stats: {
            totalBorrowed: 0,
            overdueBooks: 0,
            totalFines: 0,
            booksRead: 0,
            currentBorrowingLimit: 5
          },
          success: false
        });
      }
    } catch (error) {
      console.error('❌ [MY BOOKS DEBUG] Network/Parse error:', error);
      console.error('❌ [MY BOOKS DEBUG] Error details:', error instanceof Error ? error.message : 'Unknown error');
      toast.error(`Error loading your books: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Set empty data to stop loading
      console.log('📝 [MY BOOKS DEBUG] Setting empty data due to network error...');
      setData({
        currentLoans: [],
        history: [],
        stats: {
          totalBorrowed: 0,
          overdueBooks: 0,
          totalFines: 0,
          booksRead: 0,
          currentBorrowingLimit: 5
        },
        success: false
      });
    } finally {
      console.log('🏁 [MY BOOKS DEBUG] fetchMyBooks completed, setting loading to false');
      setLoading(false);
    }
  };

  const handleRenew = async (transactionId: number) => {
    if (!user?.patronId) {
      toast.error('Please log in to renew books');
      return;
    }

    setRenewingBooks(prev => new Set([...prev, transactionId]));
    
    try {
      const response = await fetch('/api/patron/books', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          patronId: user.patronId
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        toast.success('Book renewed successfully!');
        // Refresh the data
        fetchMyBooks(activeTab === 'history');
      } else {
        toast.error(result.error || 'Failed to renew book');
      }
    } catch (error) {
      console.error('Error renewing book:', error);
      toast.error('Error renewing book');
    } finally {
      setRenewingBooks(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'history' && (!data?.history || data.history.length === 0)) {
      fetchMyBooks(true);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'returned': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDueDateColor = (dueDate: string, status: string) => {
    if (status === 'overdue') return 'text-red-600';
    const daysLeft = getDaysUntilDue(dueDate);
    if (daysLeft <= 3) return 'text-orange-600';
    if (daysLeft <= 7) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your books...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <Book className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Failed to load your books</p>
        <Button onClick={() => fetchMyBooks()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Books</h1>
        <p className="text-muted-foreground">
          Manage your borrowed books and view your reading history
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Currently Borrowed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalBorrowed}</div>
            <Progress 
              value={(data.stats.totalBorrowed / data.stats.currentBorrowingLimit) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.totalBorrowed} of {data.stats.currentBorrowingLimit} books
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Books</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${data.stats.overdueBooks > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.stats.overdueBooks > 0 ? 'text-red-600' : ''}`}>
              {data.stats.overdueBooks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.overdueBooks === 0 ? 'All up to date!' : 'Need immediate attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fines</CardTitle>
            <Clock className={`h-4 w-4 ${data.stats.totalFines > 0 ? 'text-orange-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.stats.totalFines > 0 ? 'text-orange-600' : ''}`}>
              ${data.stats.totalFines.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.totalFines === 0 ? 'No fines!' : 'Please pay promptly'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Read</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.stats.booksRead}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Keep reading!
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Books Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">Current Loans ({data.stats.totalBorrowed})</TabsTrigger>
          <TabsTrigger value="history">Reading History ({data.stats.booksRead})</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          {data.currentLoans.length > 0 ? (
            <div className="grid gap-4">
              {data.currentLoans.map((book) => {
                const isRenewing = renewingBooks.has(book.transactionId);
                const daysLeft = getDaysUntilDue(book.dueDate);
                
                return (
                  <Card key={book.transactionId}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        {/* Book Image */}
                        <div className="relative w-16 h-20 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {book.item.imageUrl ? (
                            <Image
                              src={book.item.imageUrl}
                              alt={book.item.title}
                              fill
                              className="object-contain p-1"
                              unoptimized={true}
                            />
                          ) : (
                            <Book className="h-8 w-8 text-gray-400" />
                          )}
                        </div>

                        {/* Book Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-lg font-semibold truncate">{book.item.title}</h3>
                              <p className="text-muted-foreground">by {book.item.author}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline">{book.item.itemType}</Badge>
                                {book.item.subject && (
                                  <Badge variant="outline">{book.item.subject}</Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <Badge className={getStatusBadgeColor(book.status)}>
                                {book.status === 'overdue' ? `Overdue ${book.daysOverdue} days` : book.status}
                              </Badge>
                            </div>
                          </div>

                          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Borrowed:</span>
                              <div>{formatDate(book.borrowedAt)}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Due Date:</span>
                              <div className={getDueDateColor(book.dueDate, book.status)}>
                                {formatDate(book.dueDate)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Days Left:</span>
                              <div className={getDueDateColor(book.dueDate, book.status)}>
                                {book.status === 'overdue' ? 
                                  `${book.daysOverdue} days overdue` : 
                                  `${Math.max(0, daysLeft)} days`
                                }
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fine:</span>
                              <div className={book.fine > 0 ? 'text-red-600 font-medium' : ''}>
                                ${book.fine.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex space-x-2">
                            <Button
                              onClick={() => handleRenew(book.transactionId)}
                              disabled={book.status === 'overdue' || isRenewing}
                              size="sm"
                              variant="outline"
                            >
                              {isRenewing ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Renewing...
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="mr-2 h-4 w-4" />
                                  Renew
                                </>
                              )}
                            </Button>
                            
                            {book.status === 'overdue' && (
                              <Badge variant="destructive" className="px-3 py-1">
                                <AlertTriangle className="mr-1 h-3 w-3" />
                                Return Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No books currently borrowed</p>
                <p className="text-muted-foreground">
                  Visit the catalog to find something interesting to read!
                </p>
                <Link href="/patron/browse">
                  <Button className="mt-4">
                    <Book className="mr-2 h-4 w-4" />
                    Browse Catalog
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {data.history.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Reading History</CardTitle>
                <CardDescription>
                  Your previously borrowed books
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Borrowed</TableHead>
                      <TableHead>Returned</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.history.slice(0, 20).map((book) => {
                      const borrowedDate = new Date(book.borrowedAt);
                      const returnedDate = new Date(book.returnedAt!);
                      const duration = Math.ceil((returnedDate.getTime() - borrowedDate.getTime()) / (1000 * 60 * 60 * 24));
                      
                      return (
                        <TableRow key={book.transactionId}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{book.item.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {book.item.itemType} • {book.item.subject}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{book.item.author}</TableCell>
                          <TableCell>{formatDate(book.borrowedAt)}</TableCell>
                          <TableCell>{formatDate(book.returnedAt!)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {duration} days
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                
                {data.history.length > 20 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Showing 20 of {data.history.length} books
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No reading history yet</p>
                <p className="text-muted-foreground">
                  Start borrowing books to build your reading history!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
