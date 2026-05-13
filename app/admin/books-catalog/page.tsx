'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash, 
  BookOpen, 
  Users, 
  Clock,
  AlertTriangle,
  Check,
  X,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

interface Book {
  itemId: number;
  title: string;
  author: string;
  isbn?: string;
  subject?: string;
  keywords?: string;
  itemType: string;
  price: number;
  imageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  condition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'DAMAGED' | 'UNUSABLE';
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    transaction: number;
    reservation: number;
    borrowrequest: number;
  };
}

interface BooksResponse {
  books: Book[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  statistics: {
    totalItems: number;
    availableItems: number;
    unavailableItems: number;
    totalCopies: number;
    availableCopies: number;
  };
  filters: {
    search: string;
    itemType: string;
    condition: string;
    availability: string;
    sortBy: string;
    sortOrder: string;
  };
}

const CONDITION_COLORS = {
  EXCELLENT: 'bg-green-100 text-green-800',
  GOOD: 'bg-blue-100 text-blue-800',
  FAIR: 'bg-yellow-100 text-yellow-800',
  POOR: 'bg-orange-100 text-orange-800',
  DAMAGED: 'bg-red-100 text-red-800',
  UNUSABLE: 'bg-gray-100 text-gray-800'
};

export default function BooksCatalogPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters and search
  const [search, setSearch] = useState('');
  const [itemType, setItemType] = useState('ALL');
  const [condition, setCondition] = useState('ALL');
  const [availability, setAvailability] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState<BooksResponse['pagination']>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });
  
  // Statistics
  const [statistics, setStatistics] = useState<BooksResponse['statistics']>({
    totalItems: 0,
    availableItems: 0,
    unavailableItems: 0,
    totalCopies: 0,
    availableCopies: 0
  });
  
  // Selection and bulk operations
  const [selectedBooks, setSelectedBooks] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<string | null>(null);
  
  // Dialogs
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Fetch books data
  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search,
        itemType,
        condition,
        availability,
        sortBy,
        sortOrder
      });
      
      const response = await fetch(`/api/admin/books?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch books');
      }
      
      const data: BooksResponse = await response.json();
      
      setBooks(data.books);
      setPagination(data.pagination);
      setStatistics(data.statistics);
      
    } catch (err) {
      console.error('Error fetching books:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when filters change
  useEffect(() => {
    fetchBooks();
  }, [currentPage, itemsPerPage, search, itemType, condition, availability, sortBy, sortOrder]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchBooks();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  // Handle selection
  const handleSelectBook = (bookId: number, checked: boolean) => {
    if (checked) {
      setSelectedBooks(prev => [...prev, bookId]);
    } else {
      setSelectedBooks(prev => prev.filter(id => id !== bookId));
      setSelectAll(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedBooks(books.map(book => book.itemId));
      setSelectAll(true);
    } else {
      setSelectedBooks([]);
      setSelectAll(false);
    }
  };

  // Handle delete book
  const handleDeleteBook = async (book: Book) => {
    try {
      const response = await fetch(`/api/admin/books/${book.itemId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || errorData.error || 'Failed to delete book');
      }

      toast.success('Book deleted successfully');
      fetchBooks();
      setShowDeleteDialog(false);
      setBookToDelete(null);

    } catch (err) {
      console.error('Error deleting book:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete book');
    }
  };

  // Handle bulk operations
  const handleBulkAction = async (action: string) => {
    if (selectedBooks.length === 0) {
      toast.error('Please select books first');
      return;
    }

    try {
      const response = await fetch('/api/admin/books/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          itemIds: selectedBooks
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Bulk operation failed');
      }

      const result = await response.json();
      toast.success(result.message);
      
      // Reset selection and refresh data
      setSelectedBooks([]);
      setSelectAll(false);
      fetchBooks();

    } catch (err) {
      console.error('Error in bulk operation:', err);
      toast.error(err instanceof Error ? err.message : 'Bulk operation failed');
    }

    setShowBulkDialog(false);
    setBulkActionType(null);
  };

  // Handle export
  const handleExport = async () => {
    try {
      const response = await fetch('/api/admin/books/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'EXPORT',
          itemIds: selectedBooks.length > 0 ? selectedBooks : books.map(b => b.itemId)
        })
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const result = await response.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `books-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`${result.data.length} books exported successfully`);

    } catch (err) {
      console.error('Error exporting books:', err);
      toast.error('Failed to export books');
    }
  };

  const getAvailabilityBadge = (book: Book) => {
    if (!book.isVisible) {
      return <Badge variant="secondary"><EyeOff className="w-3 h-3 mr-1" />Hidden</Badge>;
    }
    if (book.availableCopies === 0) {
      return <Badge variant="destructive">Unavailable</Badge>;
    }
    if (book.availableCopies < book.totalCopies * 0.2) {
      return <Badge variant="outline" className="text-orange-600">Low Stock</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>;
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error loading books: {error}</span>
            </div>
            <div className="flex justify-center mt-4">
              <Button onClick={fetchBooks} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books Catalog</h1>
          <p className="text-muted-foreground">Manage your library's book collection</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Book
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.totalCopies} total copies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Check className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.availableItems}</div>
            <p className="text-xs text-muted-foreground">
              {statistics.availableCopies} copies available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unavailable</CardTitle>
            <X className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{statistics.unavailableItems}</div>
            <p className="text-xs text-muted-foreground">
              Out of stock items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.totalCopies > 0 
                ? Math.round(((statistics.totalCopies - statistics.availableCopies) / statistics.totalCopies) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Currently borrowed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedBooks.length}</div>
            <p className="text-xs text-muted-foreground">
              Books selected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search books by title, author, ISBN..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={itemType} onValueChange={setItemType}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="BOOK">Books</SelectItem>
                <SelectItem value="JOURNAL">Journals</SelectItem>
                <SelectItem value="MAGAZINE">Magazines</SelectItem>
                <SelectItem value="DVD">DVDs</SelectItem>
              </SelectContent>
            </Select>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Conditions</SelectItem>
                <SelectItem value="EXCELLENT">Excellent</SelectItem>
                <SelectItem value="GOOD">Good</SelectItem>
                <SelectItem value="FAIR">Fair</SelectItem>
                <SelectItem value="POOR">Poor</SelectItem>
                <SelectItem value="DAMAGED">Damaged</SelectItem>
                <SelectItem value="UNUSABLE">Unusable</SelectItem>
              </SelectContent>
            </Select>
            <Select value={availability} onValueChange={setAvailability}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="UNAVAILABLE">Unavailable</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedBooks.length > 0 && (
            <div className="flex items-center justify-between p-4 mt-4 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700">
                {selectedBooks.length} book(s) selected
              </span>
              <div className="space-x-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setBulkActionType('DELETE');
                    setShowBulkDialog(true);
                  }}
                >
                  <Trash className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    setBulkActionType('UPDATE_VISIBILITY');
                    setShowBulkDialog(true);
                  }}
                >
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide/Show
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export Selected
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Books Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading books...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Book Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.itemId}>
                    <TableCell>
                      <Checkbox
                        checked={selectedBooks.includes(book.itemId)}
                        onCheckedChange={(checked) => 
                          handleSelectBook(book.itemId, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {book.imageUrl ? (
                            <img 
                              src={book.imageUrl} 
                              alt={book.title}
                              className="w-12 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-16 bg-gray-100 rounded flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {book.title}
                          </div>
                          <div className="text-sm text-gray-500 truncate">
                            by {book.author}
                          </div>
                          {book.isbn && (
                            <div className="text-xs text-gray-400">
                              ISBN: {book.isbn}
                            </div>
                          )}
                          {book.subject && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {book.subject}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{book.itemType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{book.availableCopies} / {book.totalCopies}</div>
                        <div className="text-xs text-gray-500">available</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={CONDITION_COLORS[book.condition]}>
                        {book.condition.toLowerCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getAvailabilityBadge(book)}
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>{book._count.transaction} borrows</div>
                        <div>{book._count.reservation} reservations</div>
                        <div>{book._count.borrowrequest} requests</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setBookToDelete(book);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount} books
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Select 
            value={itemsPerPage.toString()} 
            onValueChange={(value) => {
              setItemsPerPage(Number(value));
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-500">per page</span>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={!pagination.hasPreviousPage}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-3">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pagination.totalPages))}
              disabled={!pagination.hasNextPage}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Book</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{bookToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => bookToDelete && handleDeleteBook(bookToDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation Dialog */}
      <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action Confirmation</DialogTitle>
            <DialogDescription>
              Are you sure you want to perform this action on {selectedBooks.length} selected book(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => bulkActionType && handleBulkAction(bulkActionType)}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
