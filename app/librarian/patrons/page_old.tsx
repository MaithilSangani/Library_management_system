'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Eye, UserPlus, AlertCircle, Users, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/app/components/ui/dialog';
import { Label } from '@/app/components/ui/label';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Textarea } from '@/app/components/ui/textarea';
import { toast } from 'sonner';

interface Patron {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  studentId?: string;
  employeeId?: string;
  isStudent: boolean;
  isFaculty: boolean;
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
  activeTransactions: number;
  totalTransactions: number;
  overdueTransactions: number;
  activeReservations: number;
  totalReservations: number;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface PatronFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  isStudent: boolean;
  isFaculty: boolean;
  studentId: string;
  employeeId: string;
}

export default function PatronManagementPage() {
  const [patrons, setPatrons] = useState<Patron[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState<Patron | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<PatronFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    isStudent: false,
    isFaculty: false,
    studentId: '',
    employeeId: ''
  });

  // Fetch patrons
  const fetchPatrons = async (page = 1, search = searchQuery, type = typeFilter, status = statusFilter) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search,
        type,
        status
      });

      const response = await fetch(`/api/librarian/patrons?${params}`);
      const data = await response.json();

      if (data.success) {
        setPatrons(data.data.patrons);
        setPagination(data.data.pagination);
      } else {
        toast.error('Failed to fetch patrons');
      }
    } catch (error) {
      toast.error('Failed to fetch patrons');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and when filters change
  useEffect(() => {
    fetchPatrons(1, searchQuery, typeFilter, statusFilter);
    setCurrentPage(1);
  }, [searchQuery, typeFilter, statusFilter]);

  // Handle search
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle form changes
  const handleFormChange = (field: keyof PatronFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      address: '',
      password: '',
      isStudent: false,
      isFaculty: false,
      studentId: '',
      employeeId: ''
    });
  };

  // Handle add patron
  const handleAddPatron = async () => {
    try {
      const response = await fetch('/api/librarian/patrons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Patron created successfully');
        setShowAddModal(false);
        resetForm();
        fetchPatrons(currentPage);
      } else {
        toast.error(data.error || 'Failed to create patron');
      }
    } catch (error) {
      toast.error('Failed to create patron');
      console.error('Error:', error);
    }
  };

  // Handle edit patron
  const handleEditPatron = async () => {
    if (!selectedPatron) return;

    try {
      const response = await fetch(`/api/librarian/patrons/${selectedPatron.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Patron updated successfully');
        setShowEditModal(false);
        setSelectedPatron(null);
        resetForm();
        fetchPatrons(currentPage);
      } else {
        toast.error(data.error || 'Failed to update patron');
      }
    } catch (error) {
      toast.error('Failed to update patron');
      console.error('Error:', error);
    }
  };

  // Handle delete patron
  const handleDeletePatron = async () => {
    if (!selectedPatron) return;

    try {
      const response = await fetch(`/api/librarian/patrons/${selectedPatron.id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Patron deleted successfully');
        setShowDeleteModal(false);
        setSelectedPatron(null);
        fetchPatrons(currentPage);
      } else {
        toast.error(data.error || 'Failed to delete patron');
      }
    } catch (error) {
      toast.error('Failed to delete patron');
      console.error('Error:', error);
    }
  };

  // Handle view patron
  const handleViewPatron = async (patron: Patron) => {
    try {
      const response = await fetch(`/api/librarian/patrons/${patron.id}`);
      const data = await response.json();

      if (data.success) {
        setSelectedPatron({ ...patron, ...data.data });
        setShowViewModal(true);
      } else {
        toast.error('Failed to fetch patron details');
      }
    } catch (error) {
      toast.error('Failed to fetch patron details');
      console.error('Error:', error);
    }
  };

  // Open edit modal with patron data
  const openEditModal = (patron: Patron) => {
    setSelectedPatron(patron);
    setFormData({
      firstName: patron.firstName,
      lastName: patron.lastName,
      email: patron.email,
      phone: patron.phone || '',
      address: patron.address || '',
      password: '', // Never populate password
      isStudent: patron.isStudent,
      isFaculty: patron.isFaculty,
      studentId: patron.studentId || '',
      employeeId: patron.employeeId || ''
    });
    setShowEditModal(true);
  };

  // Get patron type badge
  const getPatronTypeBadge = (patron: Patron) => {
    if (patron.isStudent) {
      return <Badge className="bg-blue-100 text-blue-800">Student</Badge>;
    }
    if (patron.isFaculty) {
      return <Badge className="bg-purple-100 text-purple-800">Faculty</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800">General</Badge>;
  };

  // Get status badge
  const getStatusBadge = (patron: Patron) => {
    if (patron.isSuspended) {
      return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  // Pagination controls
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchPatrons(page);
  };

  if (loading && patrons.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Patron Management</h1>
          <p className="text-gray-600">Manage library patrons and their information</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Patron
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Total Patrons</p>
                <p className="text-2xl font-bold">{pagination?.totalCount || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserCheck className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Active Patrons</p>
                <p className="text-2xl font-bold">{patrons.filter(p => !p.isSuspended).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <UserX className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">Suspended</p>
                <p className="text-2xl font-bold">{patrons.filter(p => p.isSuspended).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium">With Overdue</p>
                <p className="text-2xl font-bold">{patrons.filter(p => p.overdueTransactions > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patrons by name, email, or ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="faculty">Faculty</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patrons Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patrons</CardTitle>
          <CardDescription>
            {pagination && `Showing ${patrons.length} of ${pagination.totalCount} patrons`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active Books</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patrons.map((patron) => (
                <TableRow key={patron.id}>
                  <TableCell className="font-medium">
                    {patron.firstName} {patron.lastName}
                    {patron.studentId && (
                      <div className="text-xs text-gray-500">ID: {patron.studentId}</div>
                    )}
                    {patron.employeeId && (
                      <div className="text-xs text-gray-500">EMP: {patron.employeeId}</div>
                    )}
                  </TableCell>
                  <TableCell>{patron.email}</TableCell>
                  <TableCell>{getPatronTypeBadge(patron)}</TableCell>
                  <TableCell>{getStatusBadge(patron)}</TableCell>
                  <TableCell>{patron.activeTransactions}</TableCell>
                  <TableCell>
                    {patron.overdueTransactions > 0 ? (
                      <Badge className="bg-red-100 text-red-800">{patron.overdueTransactions}</Badge>
                    ) : (
                      <span className="text-gray-500">None</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(patron.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewPatron(patron)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(patron)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedPatron(patron);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={!pagination.hasPrevious}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={!pagination.hasNext}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Patron Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Patron</DialogTitle>
            <DialogDescription>
              Create a new patron account with their information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password*</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                  placeholder="123 Main St"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => handleFormChange('studentId', e.target.value)}
                  placeholder="STU123456"
                  disabled={formData.isFaculty}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleFormChange('employeeId', e.target.value)}
                  placeholder="EMP123456"
                  disabled={formData.isStudent}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isStudent"
                  checked={formData.isStudent}
                  onCheckedChange={(checked) => {
                    handleFormChange('isStudent', checked as boolean);
                    if (checked) handleFormChange('isFaculty', false);
                  }}
                />
                <Label htmlFor="isStudent">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isFaculty"
                  checked={formData.isFaculty}
                  onCheckedChange={(checked) => {
                    handleFormChange('isFaculty', checked as boolean);
                    if (checked) handleFormChange('isStudent', false);
                  }}
                />
                <Label htmlFor="isFaculty">Faculty</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPatron}>Create Patron</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Patron Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Patron</DialogTitle>
            <DialogDescription>
              Update patron information. Leave password field empty to keep current password.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstName">First Name*</Label>
                <Input
                  id="edit-firstName"
                  value={formData.firstName}
                  onChange={(e) => handleFormChange('firstName', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastName">Last Name*</Label>
                <Input
                  id="edit-lastName"
                  value={formData.lastName}
                  onChange={(e) => handleFormChange('lastName', e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email*</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFormChange('email', e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-password">New Password</Label>
              <Input
                id="edit-password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFormChange('password', e.target.value)}
                placeholder="Leave empty to keep current password"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => handleFormChange('address', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-studentId">Student ID</Label>
                <Input
                  id="edit-studentId"
                  value={formData.studentId}
                  onChange={(e) => handleFormChange('studentId', e.target.value)}
                  disabled={formData.isFaculty}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-employeeId">Employee ID</Label>
                <Input
                  id="edit-employeeId"
                  value={formData.employeeId}
                  onChange={(e) => handleFormChange('employeeId', e.target.value)}
                  disabled={formData.isStudent}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isStudent"
                  checked={formData.isStudent}
                  onCheckedChange={(checked) => {
                    handleFormChange('isStudent', checked as boolean);
                    if (checked) handleFormChange('isFaculty', false);
                  }}
                />
                <Label htmlFor="edit-isStudent">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-isFaculty"
                  checked={formData.isFaculty}
                  onCheckedChange={(checked) => {
                    handleFormChange('isFaculty', checked as boolean);
                    if (checked) handleFormChange('isStudent', false);
                  }}
                />
                <Label htmlFor="edit-isFaculty">Faculty</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditPatron}>Update Patron</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Patron Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Patron Details</DialogTitle>
            <DialogDescription>
              Complete information about {selectedPatron?.firstName} {selectedPatron?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedPatron && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Personal Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Name:</strong> {selectedPatron.firstName} {selectedPatron.lastName}</p>
                    <p><strong>Email:</strong> {selectedPatron.email}</p>
                    <p><strong>Phone:</strong> {selectedPatron.phone || 'N/A'}</p>
                    <p><strong>Address:</strong> {selectedPatron.address || 'N/A'}</p>
                    {selectedPatron.studentId && <p><strong>Student ID:</strong> {selectedPatron.studentId}</p>}
                    {selectedPatron.employeeId && <p><strong>Employee ID:</strong> {selectedPatron.employeeId}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Account Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> {getPatronTypeBadge(selectedPatron)}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedPatron)}</p>
                    <p><strong>Member Since:</strong> {new Date(selectedPatron.createdAt).toLocaleDateString()}</p>
                    <p><strong>Last Updated:</strong> {new Date(selectedPatron.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Library Activity</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{selectedPatron.activeTransactions}</p>
                    <p className="text-sm text-blue-800">Active Loans</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{selectedPatron.totalTransactions}</p>
                    <p className="text-sm text-green-800">Total Loans</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{selectedPatron.overdueTransactions}</p>
                    <p className="text-sm text-red-800">Overdue Books</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{selectedPatron.activeReservations}</p>
                    <p className="text-sm text-purple-800">Active Reservations</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Patron</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedPatron?.firstName} {selectedPatron?.lastName}? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {selectedPatron && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                This patron has {selectedPatron.activeTransactions} active transactions and{' '}
                {selectedPatron.activeReservations} active reservations.
              </p>
              {(selectedPatron.activeTransactions > 0 || selectedPatron.activeReservations > 0) && (
                <p className="text-sm text-red-600 mt-2">
                  You cannot delete a patron with active transactions or reservations.
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeletePatron}
              disabled={selectedPatron && (selectedPatron.activeTransactions > 0 || selectedPatron.activeReservations > 0)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
