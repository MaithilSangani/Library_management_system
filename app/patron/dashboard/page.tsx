'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Book, Search, Clock, Heart, AlertTriangle } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<BookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = () => {
    setIsSearching(true);
    // Simulate search
    setTimeout(() => {
      const results = mockBooks.filter(book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setSearchResults(results);
      setIsSearching(false);
    }, 500);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Borrowed': return 'bg-red-100 text-red-800';
      case 'Reserved': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back, John!</h1>
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
            <Book className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              2 due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground">
              1 ready for pickup
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist Items</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              3 now available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Fines</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0.00</div>
            <p className="text-xs text-muted-foreground">
              All clear!
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Loans */}
        <Card>
          <CardHeader>
            <CardTitle>Current Loans</CardTitle>
            <CardDescription>Books you currently have checked out</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "The Great Gatsby", dueDate: "2024-08-29", daysLeft: 7 },
                { title: "1984", dueDate: "2024-08-25", daysLeft: 3 },
                { title: "To Kill a Mockingbird", dueDate: "2024-09-05", daysLeft: 14 }
              ].map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{book.title}</h4>
                    <p className="text-sm text-muted-foreground">Due: {book.dueDate}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={book.daysLeft < 5 ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"}>
                      {book.daysLeft} days left
                    </Badge>
                    <Button variant="outline" size="sm">Renew</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Reservations */}
        <Card>
          <CardHeader>
            <CardTitle>Your Reservations</CardTitle>
            <CardDescription>Books reserved and waiting for pickup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: "Dune", status: "Ready for Pickup", expiry: "2024-08-25" },
                { title: "The Hobbit", status: "Processing", position: 2 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {item.status === "Ready for Pickup" 
                        ? `Expires: ${item.expiry}`
                        : `Position ${item.position} in queue`
                      }
                    </p>
                  </div>
                  <Badge className={item.status === "Ready for Pickup" 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                  }>
                    {item.status}
                  </Badge>
                </div>
              ))}
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
