'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Switch } from '@/app/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/app/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { Progress } from '@/app/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { User, Mail, Bell, Shield, CreditCard, History, Save, Loader2, GraduationCap, BookOpen, Clock, AlertTriangle, RefreshCw, Calendar } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { toast } from 'sonner';

interface PatronProfile {
  patronId: number;
  patronEmail: string;
  patronFirstName: string;
  patronLastName: string;
  fullName: string;
  isStudent: boolean;
  isFaculty: boolean;
  patronCreatedAt: string;
  patronUpdatedAt: string;
  userType: string;
  status: string;
  stats: {
    totalBorrowed: number;
    currentLoans: number;
    overdueBooks: number;
    totalFines: number;
    reservations: number;
    wishlistItems: number;
    memberSince: string;
  };
  recentTransactions: {
    transactionId: number;
    borrowedAt: string;
    returnedAt: string | null;
    dueDate: string;
    isReturned: boolean;
    finePaid: number | null;
    isOverdue: boolean;
    item: {
      title: string;
      author: string;
      itemType: string;
    };
  }[];
  reservations: {
    reservationId: number;
    reservedAt: string;
    item: {
      title: string;
      author: string;
      itemType: string;
    };
  }[];
  wishlistItems: {
    wishlistId: number;
    priority: string;
    notes: string | null;
    addedAt: string;
    item: {
      itemId: number;
      title: string;
      author: string;
      itemType: string;
      isbn: string | null;
      subject: string | null;
      imageUrl: string | null;
      availableCopies: number;
      totalCopies: number;
      price: number;
      condition: string;
      createdAt: string;
    };
  }[];
  studentDetails?: {
    department: string | null;
    semester: number | null;
    rollNo: number | null;
    enrollmentNumber: number | null;
  };
  facultyDetails?: {
    department: string | null;
  };
}

export default function PatronAccount() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatronProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  const [studentFormData, setStudentFormData] = useState({
    department: '',
    semester: 1,
    rollNo: 0,
    enrollmentNumber: 0
  });

  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: false,
    overdueNotices: true,
    newBookAlerts: true,
    recommendationEmails: false
  });

  // Fetch profile data with dynamic refresh
  const fetchProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/patron/profile', {
        headers: {
          'Cache-Control': 'no-cache',
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const profileData = await response.json();
        setProfile(profileData);
        setError(null);
        setFormData({
          firstName: profileData.patronFirstName || '',
          lastName: profileData.patronLastName || '',
          email: profileData.patronEmail || ''
        });
        
        // Set student-specific data if available
        if (profileData.studentDetails) {
          setStudentFormData({
            department: profileData.studentDetails.department || '',
            semester: profileData.studentDetails.semester || 1,
            rollNo: profileData.studentDetails.rollNo || 0,
            enrollmentNumber: profileData.studentDetails.enrollmentNumber || 0
          });
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || 'Failed to load profile data';
        setError(errorMessage);
        toast.error(errorMessage);
        if (response.status === 401) {
          // Redirect to login if unauthorized
          window.location.href = '/login';
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to connect to server');
      toast.error('Error loading profile');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Refresh data without showing loading spinner
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProfile(false);
    setRefreshing(false);
    toast.success('Profile data refreshed');
  };

  // Validation helper
  const validateForm = () => {
    const errors = [];
    
    if (!formData.firstName.trim()) {
      errors.push('First name is required');
    }
    
    if (!formData.lastName.trim()) {
      errors.push('Last name is required');
    }
    
    if (!formData.email.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    // Validate student fields if user is a student
    if (profile?.isStudent) {
      if (!studentFormData.department.trim()) {
        errors.push('Department is required for students');
      }
      
      if (studentFormData.semester < 1 || studentFormData.semester > 8) {
        errors.push('Semester must be between 1 and 8');
      }
      
      if (studentFormData.rollNo && studentFormData.rollNo < 1) {
        errors.push('Roll number must be a positive number');
      }
      
      if (studentFormData.enrollmentNumber) {
        if (studentFormData.enrollmentNumber < 1) {
          errors.push('Enrollment number must be a positive number');
        }
        
        // Check if enrollment number is too large (exceeds INT max value)
        if (studentFormData.enrollmentNumber > 2147483647) {
          errors.push('Enrollment number is too large. Please use a smaller number.');
        }
      }
    }
    
    return errors;
  };

  // Save profile changes (including student data)
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate form data
      const errors = validateForm();
      if (errors.length > 0) {
        toast.error(`Please fix the following errors:\n${errors.join('\n')}`);
        return;
      }
      
      console.log('Saving profile with data:', {
        patronFirstName: formData.firstName.trim(),
        patronLastName: formData.lastName.trim(),
        patronEmail: formData.email.trim(),
        studentDetails: profile?.isStudent ? {
          department: studentFormData.department.trim(),
          semester: Number(studentFormData.semester),
          rollNo: Number(studentFormData.rollNo) || null,
          enrollmentNumber: Number(studentFormData.enrollmentNumber) || null
        } : undefined
      });
      
      const updateData: any = {
        patronFirstName: formData.firstName.trim(),
        patronLastName: formData.lastName.trim(),
        patronEmail: formData.email.trim(),
      };
      
      // Include student details if user is a student
      if (profile?.isStudent) {
        updateData.studentDetails = {
          department: studentFormData.department.trim(),
          semester: Number(studentFormData.semester),
          rollNo: Number(studentFormData.rollNo) || null,
          enrollmentNumber: Number(studentFormData.enrollmentNumber) || null
        };
      }
      
      const token = localStorage.getItem('auth-token');
      const response = await fetch('/api/patron/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Profile update result:', result);
        setIsEditing(false);
        toast.success('Profile updated successfully!');
        await fetchProfile(false); // Refresh data without loading spinner
      } else {
        const error = await response.json();
        console.error('Profile update error:', error);
        
        // Handle specific error cases
        if (error.error?.includes('enrollment number') && error.error?.includes('already exists')) {
          toast.error('This enrollment number is already taken by another student. Please choose a different number.');
        } else {
          toast.error(error.error || 'Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Error saving profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    // Reset form data to original values
    if (profile) {
      setFormData({
        firstName: profile.patronFirstName || '',
        lastName: profile.patronLastName || '',
        email: profile.patronEmail || ''
      });
      
      if (profile.studentDetails) {
        setStudentFormData({
          department: profile.studentDetails.department || '',
          semester: profile.studentDetails.semester || 1,
          rollNo: profile.studentDetails.rollNo || 0,
          enrollmentNumber: profile.studentDetails.enrollmentNumber || 0
        });
      }
    }
    setIsEditing(false);
  };

  useEffect(() => {
    if (user?.patronId) {
      fetchProfile();
    }
  }, [user]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.patronId && !isEditing) {
        fetchProfile(false); // Refresh without loading spinner
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [user, isEditing]);

  // Get status badge styling
  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'good standing':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Format date helper
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

  // Calculate borrowing limit usage
  const borrowingLimitUsage = profile ? {
    current: profile.stats.currentLoans,
    limit: 5, // Default library limit
    percentage: (profile.stats.currentLoans / 5) * 100
  } : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show error state if profile failed to load and there's no profile data
  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Unable to Load Profile</h2>
          <p className="text-muted-foreground mb-4">
            {error}
          </p>
          <div className="space-x-2">
            <Button onClick={() => fetchProfile()} disabled={refreshing}>
              {refreshing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/login'}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground">
            Manage your profile and account settings
            {profile && (
              <span className="ml-2">
                • Last updated: {formatDate(profile.patronUpdatedAt)}
              </span>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>
                    Update your personal details and contact information
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {isEditing ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                    >
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture and Dynamic Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="/avatars/patron.jpg" alt={profile?.fullName} />
                    <AvatarFallback className="text-lg">
                      {profile?.patronFirstName?.charAt(0)}{profile?.patronLastName?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium">
                        {profile?.fullName || `${formData.firstName} ${formData.lastName}`}
                      </h3>
                      {profile?.isStudent && (
                        <GraduationCap className="h-5 w-5 text-blue-600" title="Student" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadgeStyle(profile?.status || '')}>
                        {profile?.status || 'Unknown'}
                      </Badge>
                      <Badge variant="outline">{profile?.userType}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Member since: {profile?.stats.memberSince ? formatDate(profile.stats.memberSince) : 'Unknown'}
                    </p>
                  </div>
                </div>
                
                {/* Account Health Indicator */}
                {profile && (
                  <div className="text-right space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Account Health:</span>
                      <div className={`h-3 w-3 rounded-full ${
                        profile.stats.overdueBooks > 0 ? 'bg-red-500' :
                        profile.stats.currentLoans > 3 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                    </div>
                    {profile.stats.overdueBooks > 0 && (
                      <Alert className="p-2 border-red-200 bg-red-50">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-xs text-red-800">
                          {profile.stats.overdueBooks} overdue book(s)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </div>

              {/* Personal Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>


              {/* Student Academic Information - Only show for students */}
              {profile?.isStudent && (
                <div className="border-t pt-6">
                  <Label className="text-base font-medium flex items-center gap-2 mb-4">
                    <GraduationCap className="h-4 w-4" />
                    Academic Information
                  </Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={studentFormData.department}
                        onChange={(e) => setStudentFormData({ ...studentFormData, department: e.target.value })}
                        disabled={!isEditing}
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select 
                        value={studentFormData.semester.toString()} 
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, semester: parseInt(value) })}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <SelectItem key={sem} value={sem.toString()}>
                              Semester {sem}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rollNo">Roll Number</Label>
                      <Input
                        id="rollNo"
                        type="number"
                        min="1"
                        value={studentFormData.rollNo || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          setStudentFormData({ ...studentFormData, rollNo: value });
                        }}
                        disabled={!isEditing}
                        placeholder="e.g., 123"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                      <Input
                        id="enrollmentNumber"
                        type="number"
                        min="1"
                        value={studentFormData.enrollmentNumber || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          setStudentFormData({ ...studentFormData, enrollmentNumber: value });
                        }}
                        disabled={!isEditing}
                        placeholder="e.g., 202301001"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Account Statistics */}
              <div className="border-t pt-6">
                <Label className="text-base font-medium mb-4 block">Account Statistics</Label>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile?.stats.totalBorrowed || 0}</div>
                    <p className="text-sm text-muted-foreground">Total Books Borrowed</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className={`text-2xl font-bold ${
                      (profile?.stats.currentLoans || 0) > 3 ? 'text-orange-600' : 'text-green-600'
                    }`}>
                      {profile?.stats.currentLoans || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Current Active Loans</p>
                    {borrowingLimitUsage && (
                      <Progress value={borrowingLimitUsage.percentage} className="mt-2 h-2" />
                    )}
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className="text-2xl font-bold text-indigo-600">{profile?.stats.reservations || 0}</div>
                    <p className="text-sm text-muted-foreground">Active Reservations</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className={`text-2xl font-bold ${
                      (profile?.stats.overdueBooks || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {profile?.stats.overdueBooks || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Overdue Books</p>
                  </div>
                  <div className="p-4 border rounded-lg text-center">
                    <div className={`text-2xl font-bold ${
                      (profile?.stats.totalFines || 0) > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      ${(profile?.stats.totalFines || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">Outstanding Fines</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email reminders for due dates
                    </p>
                  </div>
                  <Switch
                    checked={notifications.emailReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailReminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Get text message reminders
                    </p>
                  </div>
                  <Switch
                    checked={notifications.smsReminders}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, smsReminders: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Overdue Notices</Label>
                    <p className="text-sm text-muted-foreground">
                      Notifications for overdue books
                    </p>
                  </div>
                  <Switch
                    checked={notifications.overdueNotices}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, overdueNotices: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>New Book Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about new book arrivals
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newBookAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, newBookAlerts: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Recommendation Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive personalized book recommendations
                    </p>
                  </div>
                  <Switch
                    checked={notifications.recommendationEmails}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, recommendationEmails: checked })
                    }
                  />
                </div>
              </div>

              <Button>Save Preferences</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Privacy & Security
              </CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                Change Password
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Two-Factor Authentication
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Download My Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Borrowing History
              </CardTitle>
              <CardDescription>
                Your complete borrowing record
              </CardDescription>
            </CardHeader>
            <CardContent>
              {profile?.recentTransactions && profile.recentTransactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book Details</TableHead>
                      <TableHead>Borrow Date</TableHead>
                      <TableHead>Due/Return Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Fine</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.recentTransactions.map((transaction) => (
                      <TableRow key={transaction.transactionId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.item.title}</div>
                            <div className="text-sm text-muted-foreground">{transaction.item.author}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {transaction.item.itemType}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {formatDate(transaction.borrowedAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.isReturned ? (
                            <div className="text-green-600 text-sm">
                              Returned: {transaction.returnedAt ? formatDate(transaction.returnedAt) : 'N/A'}
                            </div>
                          ) : (
                            <div className={`text-sm ${
                              transaction.isOverdue ? 'text-red-600' : 'text-muted-foreground'
                            }`}>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Due: {formatDate(transaction.dueDate)}
                              </div>
                              {transaction.isOverdue && (
                                <div className="flex items-center gap-1 mt-1 text-red-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  OVERDUE
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            transaction.isOverdue && !transaction.isReturned
                              ? "bg-red-100 text-red-800"
                              : transaction.isReturned 
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }>
                            {transaction.isOverdue && !transaction.isReturned ? 'Overdue' :
                             transaction.isReturned ? 'Returned' : 'Current'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transaction.finePaid ? (
                            <span className="text-red-600 font-medium">
                              ${transaction.finePaid.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-green-600">$0.00</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No borrowing history found</p>
                  <p className="text-sm">Start borrowing books to see your transaction history here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Fine History
                  </CardTitle>
                  <CardDescription>
                    Your payment history and current balance
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">$0.00</div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Current Outstanding Fines */}
              {(profile?.stats.totalFines || 0) > 0 && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    You have outstanding fines totaling ${(profile?.stats.totalFines || 0).toFixed(2)}. 
                    Please contact the library to make a payment.
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Fine History from Transactions */}
              {profile?.recentTransactions && profile.recentTransactions.filter(t => t.finePaid && t.finePaid > 0).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Book</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Transaction Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profile.recentTransactions
                      .filter(transaction => transaction.finePaid && transaction.finePaid > 0)
                      .map((transaction) => (
                        <TableRow key={transaction.transactionId}>
                          <TableCell className="font-medium">
                            <div>
                              <div>{transaction.item.title}</div>
                              <div className="text-sm text-muted-foreground">{transaction.item.author}</div>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-red-600">
                            ${transaction.finePaid?.toFixed(2)}
                          </TableCell>
                          <TableCell>{formatDate(transaction.borrowedAt)}</TableCell>
                          <TableCell>
                            {transaction.returnedAt ? formatDate(transaction.returnedAt) : 'Not returned'}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">
                              Paid
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    }
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No fines on record</p>
                  <p className="text-sm">Great job returning books on time!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
