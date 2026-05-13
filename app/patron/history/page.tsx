'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { 
  BookOpen, 
  Search, 
  Star, 
  Calendar, 
  TrendingUp,
  Award,
  Clock,
  Loader2,
  Heart,
  Filter,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import Image from 'next/image';

interface BorrowingHistory {
  borrowingId: number;
  borrowedAt: string;
  dueDate: string;
  returnedAt?: string;
  renewalCount: number;
  wasOverdue: boolean;
  overdueDays?: number;
  fineAmount?: number;
  rating?: number;
  review?: string;
  item: {
    itemId: number;
    title: string;
    author: string;
    isbn?: string;
    subject?: string;
    itemType: string;
    imageUrl?: string;
  };
}

interface ReadingStats {
  totalBooksRead: number;
  totalReadingDays: number;
  favoriteGenre: string;
  averageRating: number;
  booksThisYear: number;
  booksThisMonth: number;
  longestReadingStreak: number;
  currentReadingStreak: number;
}

export default function PatronReadingHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<BorrowingHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<BorrowingHistory[]>([]);
  const [stats, setStats] = useState<ReadingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [genreFilter, setGenreFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');

  useEffect(() => {
    fetchReadingHistory();
    fetchReadingStats();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, yearFilter, genreFilter, ratingFilter]);

  const fetchReadingHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patron/borrowing/history');
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      } else {
        toast.error('Failed to fetch reading history');
      }
    } catch (error) {
      console.error('Error fetching reading history:', error);
      toast.error('Error loading reading history');
    } finally {
      setLoading(false);
    }
  };

  const fetchReadingStats = async () => {
    try {
      const response = await fetch('/api/patron/reading-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching reading stats:', error);
    }
  };

  const filterHistory = () => {
    let filtered = history;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.item.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.item.isbn && item.item.isbn.includes(searchTerm))
      );
    }

    // Year filter
    if (yearFilter !== 'all') {
      filtered = filtered.filter(item =>
        new Date(item.borrowedAt).getFullYear() === parseInt(yearFilter)
      );
    }

    // Genre filter
    if (genreFilter !== 'all') {
      filtered = filtered.filter(item =>
        item.item.subject?.toLowerCase() === genreFilter.toLowerCase()
      );
    }

    // Rating filter
    if (ratingFilter !== 'all') {
      const rating = parseInt(ratingFilter);
      filtered = filtered.filter(item =>
        item.rating === rating
      );
    }

    setFilteredHistory(filtered);
  };

  const rateBook = async (borrowingId: number, rating: number) => {
    try {
      const response = await fetch(`/api/patron/borrowing/${borrowingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating })
      });

      if (response.ok) {
        toast.success('Rating saved!');
        fetchReadingHistory();
      } else {
        toast.error('Failed to save rating');
      }
    } catch (error) {
      console.error('Error rating book:', error);
      toast.error('Error saving rating');
    }
  };

  const addToWishlist = async (itemId: number) => {
    try {
      const response = await fetch('/api/patron/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          priority: 'medium',
          notes: 'Added from reading history'
        })
      });

      if (response.ok) {
        toast.success('Added to wishlist!');
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to add to wishlist');
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      toast.error('Error adding to wishlist');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateReadingTime = (borrowedAt: string, returnedAt?: string) => {
    const borrowed = new Date(borrowedAt);
    const returned = returnedAt ? new Date(returnedAt) : new Date();
    const diffTime = returned.getTime() - borrowed.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderStars = (rating: number, borrowingId?: number, interactive = false) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'} ${
          interactive ? 'cursor-pointer hover:text-yellow-400' : ''
        }`}
        onClick={interactive && borrowingId ? () => rateBook(borrowingId, i + 1) : undefined}
      />
    ));
  };

  const getUniqueYears = () => {
    const years = history.map(item => new Date(item.borrowedAt).getFullYear());
    return [...new Set(years)].sort((a, b) => b - a);
  };

  const getUniqueGenres = () => {
    const genres = history
      .map(item => item.item.subject)
      .filter(Boolean) as string[];
    return [...new Set(genres)].sort();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading your reading history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reading History</h1>
        <p className="text-muted-foreground">
          Track your reading journey and discover insights about your reading habits
        </p>
      </div>

      {/* Reading Statistics */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Books Read</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBooksRead}</div>
              <p className="text-xs text-muted-foreground">
                {stats.booksThisYear} this year, {stats.booksThisMonth} this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Days</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReadingDays}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round(stats.totalReadingDays / stats.totalBooksRead)} days per book avg.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Favorite Genre</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.favoriteGenre}</div>
              <p className="text-xs text-muted-foreground">Most read category</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reading Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentReadingStreak}</div>
              <p className="text-xs text-muted-foreground">
                Best: {stats.longestReadingStreak} days
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="history">Reading History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search books..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {getUniqueYears().map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={genreFilter} onValueChange={setGenreFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {getUniqueGenres().map(genre => (
                      <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader>
              <CardTitle>Your Reading History ({filteredHistory.length} books)</CardTitle>
              <CardDescription>
                Complete record of all books you've borrowed and read
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Reading History</h3>
                  <p className="text-gray-500 mb-4">
                    {history.length === 0 
                      ? "Start borrowing books to build your reading history."
                      : "No books match your current filters."
                    }
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Details</TableHead>
                      <TableHead>Borrowed Date</TableHead>
                      <TableHead>Reading Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>My Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((item) => (
                      <TableRow key={item.borrowingId}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {item.item.imageUrl ? (
                                <Image
                                  src={item.item.imageUrl}
                                  alt={item.item.title}
                                  fill
                                  className="object-contain p-1"
                                  unoptimized={true}
                                />
                              ) : (
                                <BookOpen className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{item.item.title}</div>
                              <div className="text-sm text-muted-foreground">
                                by {item.item.author}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {item.item.subject || 'General'} • {item.item.itemType}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{formatDate(item.borrowedAt)}</div>
                            {item.returnedAt && (
                              <div className="text-xs text-muted-foreground">
                                Returned: {formatDate(item.returnedAt)}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {calculateReadingTime(item.borrowedAt, item.returnedAt)} days
                            </div>
                            {item.renewalCount > 0 && (
                              <div className="text-xs text-blue-600">
                                Renewed {item.renewalCount}x
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            {item.returnedAt ? (
                              <Badge className="bg-green-100 text-green-800">
                                Completed
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">
                                Currently Reading
                              </Badge>
                            )}
                            {item.wasOverdue && (
                              <Badge className="bg-red-100 text-red-800 mt-1">
                                Was Overdue ({item.overdueDays} days)
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {item.rating ? (
                              <div className="flex items-center gap-1">
                                {renderStars(item.rating, item.borrowingId, true)}
                                <span className="text-xs text-muted-foreground ml-2">
                                  ({item.rating}/5)
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                {renderStars(0, item.borrowingId, true)}
                                <span className="text-xs text-muted-foreground ml-2">
                                  Rate this book
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToWishlist(item.item.itemId)}
                            >
                              <Heart className="mr-1 h-4 w-4" />
                              Save
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Reading Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Reading Trends</CardTitle>
                <CardDescription>Your reading patterns over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <TrendingUp className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Reading trend chart would go here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Genre Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Genre Preferences</CardTitle>
                <CardDescription>Your reading by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-8 border-2 border-dashed rounded-lg">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Genre breakdown chart would go here
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reading Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Reading Achievements</CardTitle>
              <CardDescription>Milestones in your reading journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center space-x-3 p-4 border rounded-lg">
                  <Award className="h-8 w-8 text-yellow-500" />
                  <div>
                    <div className="font-medium">Bookworm</div>
                    <div className="text-sm text-muted-foreground">
                      Read 10+ books this year
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                  <Award className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="font-medium">Genre Explorer</div>
                    <div className="text-sm text-muted-foreground">
                      Read books from 5+ genres
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-4 border rounded-lg opacity-50">
                  <Award className="h-8 w-8 text-gray-400" />
                  <div>
                    <div className="font-medium">Speed Reader</div>
                    <div className="text-sm text-muted-foreground">
                      Finish a book in under 3 days
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
