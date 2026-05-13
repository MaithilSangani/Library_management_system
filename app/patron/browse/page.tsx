'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { 
  Search, 
  Book, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  BookOpen,
  Loader2,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Grid,
  List,
  Disc,
  Disc3,
  Film,
  Headphones,
  FileText,
  Newspaper,
  Monitor,
  HardDrive
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { useAuth } from '@/app/contexts/AuthContext';
import { getBookCoverImage, generatePlaceholderCover } from '@/app/lib/bookImages';

interface Item {
  itemId: number;
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  publishedDate?: string;
  pages?: number;
  language?: string;
  genre?: string;
  description?: string;
  subject?: string;
  itemType: string;
  price: number;
  imageUrl?: string;
  totalCopies: number;
  availableCopies: number;
  condition: string;
  location?: string;
  addedDate?: string;
  lastUpdated?: string;
  isAvailable: boolean;
  status?: 'AVAILABLE' | 'BORROWED' | 'RESERVED' | 'MAINTENANCE' | 'LOST';
}

interface ItemsResponse {
  items: Item[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    categories: string[];
    subjects: string[];
    itemTypes: string[];
    languages: string[];
    conditions: string[];
    locations: string[];
  };
}

export default function BrowseCatalog() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [borrowingItems, setBorrowingItems] = useState<Set<number>>(new Set());
  
  // Helper function to validate and refresh user session if needed
  const validateUserSession = () => {
    if (!user) {
      // Try to get user from localStorage as fallback
      const storedUser = localStorage.getItem('auth-user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          return parsedUser;
        } catch (error) {
          console.error('Failed to parse stored user:', error);
          localStorage.removeItem('auth-user');
        }
      }
      return null;
    }
    return user;
  };
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItemType, setSelectedItemType] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ItemsResponse['pagination']>({
    page: 1, limit: 12, total: 0, pages: 0, hasNext: false, hasPrev: false
  });
  
  // Available filters
  const [categories, setCategories] = useState<string[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [itemTypes, setItemTypes] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [conditions, setConditions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchItems();
  }, [currentPage, searchTerm, selectedCategory, selectedItemType, selectedLanguage, selectedCondition, selectedLocation, showAvailableOnly]);


  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory && selectedCategory !== 'all') params.append('subject', selectedCategory);
      if (selectedItemType && selectedItemType !== 'all') params.append('itemType', selectedItemType);
      if (selectedLanguage && selectedLanguage !== 'all') params.append('language', selectedLanguage);
      if (selectedCondition && selectedCondition !== 'all') params.append('condition', selectedCondition);
      if (selectedLocation && selectedLocation !== 'all') params.append('location', selectedLocation);
      if (showAvailableOnly) params.append('availableOnly', 'true');

      const response = await fetch(`/api/items?${params}`);
      if (response.ok) {
        const data: ItemsResponse = await response.json();
        setItems(data.items);
        setPagination(data.pagination);
        setCategories(data.filters.subjects || []);
        setSubjects(data.filters.subjects || []);
        setItemTypes(data.filters.itemTypes || []);
        setLanguages(data.filters.languages || []);
        setConditions(data.filters.conditions || []);
        setLocations(data.filters.locations || []);
      } else {
        toast.error('Failed to load catalog');
      }
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Error loading items');
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowRequest = async (item: Item) => {
    // Enhanced user and patron validation
    const validatedUser = validateUserSession();
    
    if (!validatedUser) {
      toast.error('Please log in to request items');
      return;
    }
    
    // Check if user is a patron
    if (validatedUser.role !== 'PATRON') {
      toast.error('Only patrons can request items. Please log in with a patron account.');
      return;
    }
    
    // Validate patronId exists and is a valid number
    const patronIdValue = validatedUser.patronId;
    if (patronIdValue === undefined || patronIdValue === null || patronIdValue === '' || isNaN(Number(patronIdValue))) {
      toast.error('Invalid patron account. Please log out and log back in.');
      return;
    }
    
    // Validate item data
    if (!item.itemId || !item.isAvailable) {
      toast.error('This item is not available for requesting');
      return;
    }
    
    setBorrowingItems(prev => new Set([...prev, item.itemId]));
    
    try {
      const requestData = {
        itemId: Number(item.itemId),
        patronId: Number(validatedUser.patronId),
        notes: `Requested from catalog: ${item.title} by ${item.author}`
      };
      
      const response = await fetch('/api/patron/borrow-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || ''}`,
        },
        body: JSON.stringify(requestData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast.success(`Borrow request submitted for "${item.title}"! \nYour request is pending librarian approval. You will receive a notification once it's processed.`, {
          duration: 5000
        });
        
        // Refresh the catalog
        await fetchItems();
      } else {
        toast.error(result.error || `Failed to submit borrow request (Status: ${response.status})`);
      }
    } catch (error) {
      console.error('Error submitting borrow request:', error);
      if (error instanceof TypeError && error.message.includes('fetch')) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        toast.error('Unexpected error occurred. Please try again.');
      }
    } finally {
      setBorrowingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.itemId);
        return newSet;
      });
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchItems();
  };

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedItemType('all');
    setSelectedLanguage('all');
    setSelectedCondition('all');
    setSelectedLocation('all');
    setShowAvailableOnly(false);
    setCurrentPage(1);
  };

  const getStatusBadgeVariant = (status?: string): "default" | "secondary" | "outline" | "destructive" => {
    if (!status) return 'secondary';
    switch (status.toUpperCase()) {
      case 'AVAILABLE': return 'default';
      case 'BORROWED': return 'secondary';
      case 'RESERVED': return 'outline';
      case 'MAINTENANCE': return 'destructive';
      case 'LOST': return 'destructive';
      default: return 'secondary';
    }
  };

  // Get appropriate icon based on item type
  const getItemTypeIcon = (itemType: string) => {
    switch (itemType.toLowerCase()) {
      case 'book': return Book;
      case 'cd': case 'audio cd': return Disc;
      case 'dvd': case 'blu-ray': return Disc3;
      case 'vhs': case 'video': return Film;
      case 'audiobook': return Headphones;
      case 'ebook': case 'digital book': return Monitor;
      case 'magazine': case 'journal': return Newspaper;
      case 'periodical': return FileText;
      case 'software': return HardDrive;
      default: return Book;
    }
  };

  // Get item-specific image handling
  const getItemImageUrls = (item: Item) => {
    if (item.itemType.toLowerCase() === 'book' && item.isbn) {
      return getBookCoverImage({
        title: item.title,
        author: item.author,
        isbn: item.isbn,
        width: 400,
        height: 600
      });
    }
    
    // For non-book items, return a placeholder URL or use existing imageUrl
    return [item.imageUrl || `https://via.placeholder.com/400x600/f3f4f6/6b7280?text=${encodeURIComponent(item.title)}`];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Get book cover image URLs with fallbacks
  const getBookCoverUrls = (title: string, author: string, isbn?: string) => {
    return getBookCoverImage({
      title,
      author,
      isbn,
      width: 400,
      height: 600
    });
  };

  // Helper functions for status (same as librarian)
  const getItemStatus = (item: Item): 'Available' | 'Partially Available' | 'Not Available' => {
    if (item.availableCopies === 0) return 'Not Available';
    if (item.availableCopies < item.totalCopies) return 'Partially Available';
    return 'Available';
  };

  const ItemCard = ({ item }: { item: Item }) => {
    const isBorrowing = borrowingItems.has(item.itemId);
    const itemImageUrls = getItemImageUrls(item);
    const status = getItemStatus(item);
    const isOutOfStock = item.availableCopies === 0;
    const isLowStock = item.availableCopies > 0 && item.availableCopies <= Math.ceil(item.totalCopies * 0.2);
    
    return (
      <Card className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-white overflow-hidden ${isOutOfStock ? 'opacity-75' : ''}`}>
        <div className="relative">
          {/* Item Image - Exact same as librarian */}
          <div className="aspect-[3/4] relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden flex items-center justify-center p-2">
            <img
              src={item.imageUrl || getBookCoverUrls(item.title, item.author, item.isbn)[0]}
              alt={item.title}
              className={`max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105 rounded shadow-sm ${isOutOfStock ? 'grayscale' : ''}`}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const fallbacks = getBookCoverUrls(item.title, item.author, item.isbn);
                
                // Try next fallback
                if (!target.dataset.fallbackIndex) {
                  target.dataset.fallbackIndex = '1';
                }
                
                const currentIndex = parseInt(target.dataset.fallbackIndex);
                if (currentIndex < fallbacks.length) {
                  target.dataset.fallbackIndex = (currentIndex + 1).toString();
                  target.src = fallbacks[currentIndex];
                  return;
                }
                
                // If all fail, hide image and show icon
                target.style.display = 'none';
                const iconElement = target.nextElementSibling as HTMLElement;
                if (iconElement) iconElement.classList.remove('hidden');
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center hidden bg-gradient-to-br from-gray-50 to-gray-100">
              <ImageIcon className="h-16 w-16 text-gray-400" />
            </div>
            
            {/* Enhanced Status Indicator - Exact same as librarian */}
            <div className="absolute top-3 right-3">
              <div className={`relative flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border transition-all duration-200 ${
                status === 'Available' 
                  ? 'bg-green-500/90 text-white border-green-400/50 shadow-lg shadow-green-500/25' 
                  : status === 'Partially Available' 
                  ? 'bg-amber-500/90 text-white border-amber-400/50 shadow-lg shadow-amber-500/25' 
                  : 'bg-red-500/90 text-white border-red-400/50 shadow-lg shadow-red-500/25'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  status === 'Available' ? 'bg-green-200' :
                  status === 'Partially Available' ? 'bg-amber-200' : 'bg-red-200'
                }`} />
                <span className="text-[10px] font-semibold">
                  {status === 'Available' ? 'Available' :
                   status === 'Partially Available' ? 'Low Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
            
            {/* Stock Level Indicator - Exact same as librarian */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
              <div 
                className={`h-full transition-all duration-500 ${
                  status === 'Available' ? 'bg-green-500' :
                  status === 'Partially Available' ? 'bg-amber-500' : 'bg-red-500'
                }`}
                style={{ width: `${(item.availableCopies / item.totalCopies) * 100}%` }}
              />
            </div>
            
            {/* Overlay for out of stock - Exact same as librarian */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <span className="text-white font-semibold text-sm bg-red-600/90 px-3 py-1 rounded-full border border-red-400/50">
                  Out of Stock
                </span>
              </div>
            )}
          </div>
          
          {/* Card Content - Exact same structure as librarian but with patron-specific actions */}
          <CardContent className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50/50">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors" title={item.title}>
                {item.title}
              </h3>
              <p className="text-sm text-gray-600 font-medium" title={item.author}>
                by {item.author}
              </p>
            </div>
            
            {/* Enhanced Metadata Row - Exact same as librarian */}
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-xs font-semibold bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-colors">
                {item.itemType}
              </Badge>
              <div className="text-right">
                <span className="font-bold text-lg text-green-600">
                  ${item.price.toFixed(2)}
                </span>
              </div>
            </div>
            
            {/* Subject Badge - Exact same as librarian */}
            {item.subject && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors">
                📚 {item.subject}
              </Badge>
            )}
            
            {/* Enhanced Stock Info - Exact same as librarian */}
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-green-500'
                }`} />
                <span className="text-xs font-medium text-gray-700">
                  Stock Status
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900">
                  {item.availableCopies}/{item.totalCopies}
                </div>
                <div className="text-xs text-gray-500">
                  {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                </div>
              </div>
            </div>
            
            {/* Additional metadata for patrons */}
            <div className="space-y-2 text-xs">
              {item.isbn && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">ISBN:</span>
                  <span className="font-mono bg-gray-100 px-2 py-1 rounded">{item.isbn}</span>
                </div>
              )}
              
              {item.language && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Language:</span>
                  <Badge variant="outline" className="text-xs">{item.language}</Badge>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Condition:</span>
                <Badge variant="outline" className={`text-xs ${
                  item.condition === 'EXCELLENT' ? 'border-green-200 text-green-700' :
                  item.condition === 'GOOD' ? 'border-blue-200 text-blue-700' :
                  item.condition === 'FAIR' ? 'border-yellow-200 text-yellow-700' :
                  'border-red-200 text-red-700'
                }`}>
                  {item.condition}
                </Badge>
              </div>
              
              {item.location && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Location:</span>
                  <Badge variant="outline" className="text-xs">{item.location}</Badge>
                </div>
              )}
            </div>
            
            {/* Patron-specific Action Button */}
            <div className="pt-2">
              <Button
                onClick={() => handleBorrowRequest(item)}
                disabled={isOutOfStock || isBorrowing}
                className="w-full group/btn hover:bg-blue-600 hover:shadow-lg transition-all duration-200"
                size="sm"
                variant={isOutOfStock ? "secondary" : "default"}
              >
                {isBorrowing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="font-medium">Requesting...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                    <span className="font-medium">
                      {isOutOfStock ? 'Unavailable' : 'Borrow Request'}
                    </span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Browse Catalog</h1>
        <p className="text-muted-foreground">
          Discover and borrow from our collection of {pagination.total} items
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, ISBN, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            <Separator />

            {/* Filters Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Item Type</label>
                <Select value={selectedItemType} onValueChange={setSelectedItemType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {itemTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Languages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Languages</SelectItem>
                    {languages.map(language => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Condition</label>
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    {conditions.map(condition => (
                      <SelectItem key={condition} value={condition}>
                        {condition}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filters Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Location</label>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  variant={showAvailableOnly ? "default" : "outline"}
                  onClick={() => setShowAvailableOnly(!showAvailableOnly)}
                  className="w-full"
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Available Only
                </Button>
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Clear All Filters
                </Button>
              </div>

              <div className="flex items-end">
                {/* Empty div for spacing */}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Info */}
      {!loading && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {items.length} of {pagination.total} results
            {searchTerm && ` for "${searchTerm}"`}
          </p>
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </div>
        </div>
      )}

      {/* Items Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <Card key={index} className="h-[700px]">
              <CardContent className="p-6 flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.itemId} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No items found</p>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={!pagination.hasPrev || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
              let pageNum;
              if (pagination.pages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= pagination.pages - 2) {
                pageNum = pagination.pages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  disabled={loading}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={!pagination.hasNext || loading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
