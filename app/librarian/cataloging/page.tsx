'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Textarea } from '@/app/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/app/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Search, BookOpen, ChevronLeft, ChevronRight, Loader2, ImageIcon, Grid, List } from 'lucide-react';
import { getBookCoverImage, generatePlaceholderCover } from '@/app/lib/bookImages';

interface Item {
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
  condition: string;
  maintenanceNotes?: string;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ItemFormData {
  title: string;
  author: string;
  isbn?: string;
  subject?: string;
  keywords?: string;
  itemType: string;
  price: number;
  imageUrl?: string;
  totalCopies: number;
  condition: string;
  maintenanceNotes?: string;
}

interface ApiResponse {
  items: Item[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    subjects: string[];
    itemTypes: string[];
  };
}

interface LibraryStats {
  totalItems: number;
  totalCopies: number;
  availableCopies: number;
  outOfStockItems: number;
  borrowedCopies: number;
}

export default function Cataloging() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedItemType, setSelectedItemType] = useState<string>('all');
  const [filters, setFilters] = useState<ApiResponse['filters']>({ subjects: [], itemTypes: [] });
  const [stats, setStats] = useState<LibraryStats>({
    totalItems: 0,
    totalCopies: 0,
    availableCopies: 0,
    outOfStockItems: 0,
    borrowedCopies: 0
  });
  
  // Modal states
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isEditItemOpen, setIsEditItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Form states
  const [formData, setFormData] = useState<ItemFormData>({
    title: '',
    author: '',
    isbn: '',
    subject: '',
    keywords: '',
    itemType: '',
    price: 0,
    imageUrl: '',
    totalCopies: 1,
    condition: 'EXCELLENT',
    maintenanceNotes: ''
  });

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchItems();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSubject, selectedItemType]);

  // Initial load
  useEffect(() => {
    fetchItems();
    fetchStats();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: '10000', // Very high limit to get all items
        ...(searchTerm && { search: searchTerm }),
        ...(selectedItemType !== 'all' && { itemType: selectedItemType }),
        ...(selectedSubject !== 'all' && { subject: selectedSubject })
      });
      
      const response = await fetch(`/api/items?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data: ApiResponse = await response.json();
      setItems(data.items);
      setFilters(data.filters);
    } catch (error) {
      console.error('Error fetching items:', error);
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/items/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch statistics');
      }
      
      const statsData: LibraryStats = await response.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Don't show error toast for stats as it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const url = editingItem ? `/api/items/${editingItem.itemId}` : '/api/items';
      const method = editingItem ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${editingItem ? 'update' : 'create'} item`);
      }
      
      toast.success(`Item ${editingItem ? 'updated' : 'created'} successfully`);
      resetForm();
      fetchItems();
      fetchStats(); // Refresh statistics after item operation
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (itemId: number, force: boolean = false) => {
    try {
      const url = force ? `/api/items/${itemId}?force=true` : `/api/items/${itemId}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Handle specific error messages from the API
        if (response.status === 400 && !force) {
          // This is a business logic error (active borrowings, reservations, etc.)
          // Show confirmation dialog for force delete
          const confirmForceDelete = window.confirm(
            `${errorData.error}\n\nWould you like to force delete this item? This will:\n• Cancel all reservations\n• Mark all unreturned items as returned\n• Delete the item from catalog\n\nThis action cannot be undone.`
          );
          
          if (confirmForceDelete) {
            // Retry with force=true
            return handleDelete(itemId, true);
          } else {
            toast.error(errorData.error);
            return;
          }
        }
        // For other errors, throw to be caught by the catch block
        throw new Error(errorData.error || 'Failed to delete item');
      }
      
      const result = await response.json();
      toast.success(result.message || 'Item deleted successfully');
      fetchItems();
      fetchStats(); // Refresh statistics after deletion
    } catch (error) {
      console.error('Error deleting item:', error);
      // This will handle network errors or other unexpected errors
      toast.error('An unexpected error occurred while deleting the item');
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      author: item.author,
      isbn: item.isbn || '',
      subject: item.subject || '',
      keywords: item.keywords || '',
      itemType: item.itemType,
      price: item.price,
      imageUrl: item.imageUrl || '',
      totalCopies: item.totalCopies,
      condition: item.condition || 'EXCELLENT',
      maintenanceNotes: item.maintenanceNotes || ''
    });
    setIsEditItemOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      subject: '',
      keywords: '',
      itemType: '',
      price: 0,
      imageUrl: '',
      totalCopies: 1,
      condition: 'EXCELLENT',
      maintenanceNotes: ''
    });
    setEditingItem(null);
    setIsAddItemOpen(false);
    setIsEditItemOpen(false);
  };

  const getItemStatus = (item: Item): 'Available' | 'Partially Available' | 'Not Available' => {
    if (item.availableCopies === 0) return 'Not Available';
    if (item.availableCopies < item.totalCopies) return 'Partially Available';
    return 'Available';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Partially Available': return 'bg-yellow-100 text-yellow-800';
      case 'Not Available': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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

  // Form component for both add and edit
  const ItemForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author">Author *</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="itemType">Item Type *</Label>
          <Select
            value={formData.itemType}
            onValueChange={(value) => setFormData({ ...formData, itemType: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select item type" />
            </SelectTrigger>
            <SelectContent>
              {Array.from(new Set([...filters.itemTypes, 'Book', 'DVD', 'Magazine', 'Reference Book'])).map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price *</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="totalCopies">Total Copies *</Label>
          <Input
            id="totalCopies"
            type="number"
            min="1"
            value={formData.totalCopies}
            onChange={(e) => setFormData({ ...formData, totalCopies: parseInt(e.target.value) || 1 })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="condition">Item Condition *</Label>
          <Select
            value={formData.condition}
            onValueChange={(value) => setFormData({ ...formData, condition: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EXCELLENT">Excellent</SelectItem>
              <SelectItem value="GOOD">Good</SelectItem>
              <SelectItem value="FAIR">Fair</SelectItem>
              <SelectItem value="POOR">Poor</SelectItem>
              <SelectItem value="DAMAGED">Damaged</SelectItem>
              <SelectItem value="UNUSABLE">Unusable</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="keywords">Keywords</Label>
          <Input
            id="keywords"
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            placeholder="Comma-separated keywords"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="maintenanceNotes">Maintenance Notes</Label>
        <Textarea
          id="maintenanceNotes"
          value={formData.maintenanceNotes}
          onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
          placeholder="Optional notes about item condition or maintenance requirements..."
          rows={3}
        />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={resetForm}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Update' : 'Add'} Item
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Cataloging</h1>
          <p className="text-muted-foreground">
            Manage your library's collection - {items.length} items displayed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="px-3"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="px-3"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Dialog open={isAddItemOpen} onOpenChange={setIsAddItemOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new item to the library catalog.
                </DialogDescription>
              </DialogHeader>
              <ItemForm />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Collection Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <BookOpen className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.availableCopies}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <BookOpen className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.outOfStockItems}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Copies</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats.totalCopies}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Library Collection */}
      <Card>
        <CardHeader>
          <CardTitle>Library Collection</CardTitle>
          <CardDescription>
            Browse and manage all items in the library
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, author, ISBN, or keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {filters.subjects.map((subject) => (
                  <SelectItem key={`subject-${subject}`} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedItemType} onValueChange={setSelectedItemType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {filters.itemTypes.map((type) => (
                  <SelectItem key={`filter-${type}`} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content based on view mode */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading items...</span>
            </div>
          ) : viewMode === 'grid' ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => {
                const status = getItemStatus(item);
                const isOutOfStock = item.availableCopies === 0;
                const isLowStock = item.availableCopies > 0 && item.availableCopies <= Math.ceil(item.totalCopies * 0.2);
                
                return (
                  <Card key={item.itemId} className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-0 shadow-md bg-white overflow-hidden ${isOutOfStock ? 'opacity-75' : ''}`}>
                    <div className="relative">
                      {/* Item Image */}
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
                        
                        {/* Enhanced Status Indicator */}
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
                        
                        {/* Stock Level Indicator */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
                          <div 
                            className={`h-full transition-all duration-500 ${
                              status === 'Available' ? 'bg-green-500' :
                              status === 'Partially Available' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${(item.availableCopies / item.totalCopies) * 100}%` }}
                          />
                        </div>
                        
                        {/* Overlay for out of stock */}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm bg-red-600/90 px-3 py-1 rounded-full border border-red-400/50">
                              Out of Stock
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Card Content */}
                      <CardContent className="p-5 space-y-4 bg-gradient-to-b from-white to-gray-50/50">
                        <div className="space-y-2">
                          <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors" title={item.title}>
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 font-medium" title={item.author}>
                            by {item.author}
                          </p>
                        </div>
                        
                        {/* Enhanced Metadata Row */}
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
                        
                        {/* Subject Badge */}
                        {item.subject && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors">
                            📚 {item.subject}
                          </Badge>
                        )}
                        
                        {/* Enhanced Stock Info */}
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
                        
                        {/* Enhanced Action Buttons */}
                        <div className="flex space-x-2 pt-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 group/btn hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="h-3 w-3 mr-2 group-hover/btn:text-blue-600 transition-colors" />
                            <span className="font-medium">Edit</span>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="px-3 group/del hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200"
                              >
                                <Trash2 className="h-3 w-3 group-hover/del:text-red-600 transition-colors" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item.itemId)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                );
              })}
              
              {/* Loading Placeholder Cards */}
              {loading && Array.from({ length: 8 }).map((_, i) => (
                <Card key={`loading-${i}`} className="animate-pulse">
                  <div className="aspect-[3/4] bg-gray-200 rounded-t-lg"></div>
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            /* Table View */
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Details</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Copies</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const status = getItemStatus(item);
                    return (
                      <TableRow key={item.itemId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.author}</div>
                            {item.keywords && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.keywords}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {item.isbn || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {item.subject ? (
                            <Badge variant="outline">{item.subject}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.itemType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(status)}>
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{item.availableCopies}/{item.totalCopies} available</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${item.price.toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(item)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{item.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(item.itemId)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}
          
          {/* Total items display */}
          {!loading && items.length > 0 && (
            <div className="flex items-center justify-center mt-4">
              <div className="text-sm text-muted-foreground">
                Displaying all {items.length} items
              </div>
            </div>
          )}

          {/* No items message - shared by both views */}
          {items.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No items found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={isEditItemOpen} onOpenChange={setIsEditItemOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details in the library catalog.
            </DialogDescription>
          </DialogHeader>
          <ItemForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
