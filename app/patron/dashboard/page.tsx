'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Book, Search, Clock, Heart, AlertTriangle, Loader2, BookOpen, RefreshCw } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { usePatronStats } from '@/app/hooks/usePatronStats';
import Link from 'next/link';

interface BookResult {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  status: 'Available' | 'Borrowed' | 'Reserved';
  location: string;
  rating: number;
}

const mockBooks: BookResult[] = [
  {
    id: '1',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '978-0-7432-7356-5',
    category: 'Fiction',
    status: 'Available',
    location: 'A1-Fiction',
    rating: 4.5
  },
  {
    id: '2',
    title: '1984',
    author: 'George Orwell',
    isbn: '978-0-452-28423-4',
    category: 'Fiction',
    status: 'Borrowed',
    location: 'A2-Fiction',
    rating: 4.8
  },
  {
    id: '3',
    title: 'A Brief History of Time',
    author: 'Stephen Hawking',
    isbn: '978-0-553-38016-3',
    category: 'Science',
    status: 'Available',
    location: 'C1-Science',
    rating: 4.3
  }
];

export default function PatronDashboard() {
  const { user } = useAuth();
  const { stats, loading: statsLoading } = usePatronStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentBooks, setCurrentBooks] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch real patron data
  const fetchPatronData = async (showLoading = false) => {
    try {
      if (showLoading) setRefreshing(true);
      const response = await fetch('/api/patron/profile');
      if (response.ok) {
        const profileData = await response.json();
        // Update current books and reservations from real data
        setCurrentBooks(profileData.recentTransactions?.filter((t: any) => !t.isReturned) || []);
        setReservations(profileData.reservations || []);
      }
    } catch (error) {
      console.error('Error fetching patron data:', error);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/catalog?search=${encodeURIComponent(searchTerm)}&limit=5`);
      if (response.ok) {
        const data = await response.json();
        const formattedResults = data.books?.map((book: any) => ({
          id: book.itemId.toString(),
          title: book.title,
          author: book.author,
          isbn: book.isbn || 'N/A',
          category: book.subject || 'Unknown',
          status: book.isAvailable ? 'Available' : 'Borrowed',
          location: 'Library',
          rating: 4.0
        })) || [];
        setSearchResults(formattedResults);
      } else {
        // Fallback to mock data if API fails
        const results = mockBooks.filter(book =>
          book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          book.author.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Error searching:', error);
      const results = mockBooks.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  // Fetch data on component mount and periodically
  React.useEffect(() => {
    if (user?.patronId) {
      fetchPatronData();
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => fetchPatronData(), 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Borrowed': return 'bg-red-100 text-red-800';
      case 'Reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getDaysLeft = (dueDateString: string) => {
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome Back{user?.patronFirstName ? `, ${user.patronFirstName}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Discover and manage your library experience
        </p>
      </div>

      {/* Quick Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Library Catalog
          </CardTitle>
          <CardDescription>
            Find books, journals, and other materials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Search by title, author, ISBN, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={isSearching}>
              {isSearching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-medium">Search Results</h4>
              {searchResults.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h5 className="font-medium">{book.title}</h5>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{book.category}</Badge>
                      <Badge className={getStatusBadgeColor(book.status)}>
                        {book.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">{book.location}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {book.status === 'Available' ? (
                      <>
                        <Button size="sm">Reserve</Button>
                        <Button variant="outline" size="sm">
                          <Heart className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm">Join Waitlist</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Books Borrowed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalBorrowed || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.overdueBooks ? `${stats.overdueBooks} overdue` : 'All up to date'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.reservations || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.reservations ? 'Ready for pickup' : 'No reservations'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.wishlistItems || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.wishlistItems ? 'Items saved' : 'No items saved'}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fines</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${(stats?.totalFines || 0) > 0 ? 'text-red-600' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : (
              <>
                <div className={`text-2xl font-bold ${(stats?.totalFines || 0) > 0 ? 'text-red-600' : ''}`}>
                  ${(stats?.totalFines || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.totalFines || 0) === 0 ? 'All clear!' : 'Please pay promptly'}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Loans - Real Data */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Current Loans</CardTitle>
              <CardDescription>Books you currently have checked out</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchPatronData(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentBooks.length > 0 ? currentBooks.map((transaction, index) => {
                const daysLeft = getDaysLeft(transaction.dueDate);
                const isOverdue = daysLeft < 0;
                const isAlmostDue = daysLeft <= 3 && daysLeft >= 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{transaction.item.title}</h4>
                      <p className="text-sm text-muted-foreground">by {transaction.item.author}</p>
                      <p className="text-sm text-muted-foreground">Due: {formatDate(transaction.dueDate)}</p>
                      {transaction.isOverdue && (
                        <p className="text-sm text-red-600 font-medium">OVERDUE - Please return immediately</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={
                        isOverdue ? "bg-red-100 text-red-800" :
                        isAlmostDue ? "bg-orange-100 text-orange-800" : 
                        "bg-blue-100 text-blue-800"
                      }>
                        {isOverdue ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                      </Badge>
                      <Button variant="outline" size="sm" disabled={isOverdue}>
                        {isOverdue ? 'Return Required' : 'Renew'}
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No current loans</p>
                  <p className="text-sm">Browse the catalog to start borrowing books.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Reservations - Real Data */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reservations</CardTitle>
            <CardDescription>Books reserved and waiting for pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reservations.length > 0 ? reservations.map((reservation, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{reservation.item.title}</h4>
                    <p className="text-sm text-muted-foreground">by {reservation.item.author}</p>
                    <p className="text-sm text-muted-foreground">
                      Reserved: {formatDate(reservation.reservedAt)}
                    </p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">
                    Active
                  </Badge>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No active reservations</p>
                  <p className="text-sm">Reserve books from the catalog when they become available.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Recommendations */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reading History</CardTitle>
            <CardDescription>Your recently returned books</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Pride and Prejudice", returnDate: "2024-08-20", rating: 5 },
                { title: "The Catcher in the Rye", returnDate: "2024-08-15", rating: 4 },
                { title: "Brave New World", returnDate: "2024-08-10", rating: 4 }
              ].map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">Returned: {book.returnDate}</p>
                  </div>
                  <div className="flex items-center">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < book.rating ? 'text-yellow-400' : 'text-gray-300'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Based on your reading preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: "Animal Farm", author: "George Orwell", reason: "Similar to 1984" },
                { title: "The Sun Also Rises", author: "Ernest Hemingway", reason: "Classic Literature" },
                { title: "Lord of the Flies", author: "William Golding", reason: "Popular Choice" }
              ].map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">{book.author}</p>
                    <p className="text-xs text-blue-600">{book.reason}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button size="sm">Reserve</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
