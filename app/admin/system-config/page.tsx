'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Users, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  DollarSign,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Calendar,
  User
} from 'lucide-react';
import { useSystemConfig } from '@/app/hooks/useSystemConfig';
import { toast } from 'sonner';

export default function SystemConfiguration() {
  const {
    settings,
    stats,
    loading,
    statsLoading,
    error,
    updateSettings,
    resetToDefaults,
    validateSettings,
    fetchSystemStats,
    formatCurrency,
    formatDate,
    getTimeAgo
  } = useSystemConfig();

  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    borrowingLimit: 5,
    loanPeriodDays: 14,
    finePerDay: 1.0
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Update form data when settings load
  useEffect(() => {
    if (settings && !hasChanges) {
      setFormData({
        borrowingLimit: settings.borrowingLimit,
        loanPeriodDays: settings.loanPeriodDays,
        finePerDay: settings.finePerDay
      });
    }
  }, [settings, hasChanges]);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    const numericValue = field === 'finePerDay' ? parseFloat(value) || 0 : parseInt(value) || 0;
    const newFormData = { ...formData, [field]: numericValue };
    setFormData(newFormData);

    // Check if there are changes
    if (settings) {
      const hasChanges = 
        newFormData.borrowingLimit !== settings.borrowingLimit ||
        newFormData.loanPeriodDays !== settings.loanPeriodDays ||
        newFormData.finePerDay !== settings.finePerDay;
      setHasChanges(hasChanges);
    }
  };

  const handleSaveSettings = async () => {
    const validationError = validateSettings(formData);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsUpdating(true);
    const success = await updateSettings({
      ...formData,
      updatedByAdminId: 1 // TODO: Get current admin ID from auth context
    });

    if (success) {
      setHasChanges(false);
    }
    setIsUpdating(false);
  };

  const handleResetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
      return;
    }

    setIsUpdating(true);
    const success = await resetToDefaults(1); // TODO: Get current admin ID from auth context
    
    if (success) {
      setFormData({
        borrowingLimit: 5,
        loanPeriodDays: 14,
        finePerDay: 1.0
      });
      setHasChanges(false);
    }
    setIsUpdating(false);
  };

  const getStatusColor = (value: number, type: 'overdue' | 'pending'): string => {
    if (type === 'overdue') {
      return value > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
    }
    if (type === 'pending') {
      return value > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground">
            Manage library system settings and view system statistics
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchSystemStats}
            disabled={statsLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh Stats
          </Button>
        </div>
      </div>

      {/* System Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalUsers || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All users across the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalItems || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Books and resources
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                stats?.totalTransactions || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All borrow transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.overdueTransactions || 0
                )}
              </div>
              {!statsLoading && stats && (
                <Badge className={getStatusColor(stats.overdueTransactions, 'overdue')}>
                  {stats.overdueTransactions > 0 ? 'Action Needed' : 'Good'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Items past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.pendingRequests || 0
                )}
              </div>
              {!statsLoading && stats && (
                <Badge className={getStatusColor(stats.pendingRequests, 'pending')}>
                  {stats.pendingRequests > 10 ? 'High' : 'Normal'}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fines Collected</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                formatCurrency(stats?.totalFinesCollected || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total fine payments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Library Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Library Settings</span>
          </CardTitle>
          <CardDescription>
            Configure system-wide parameters for the library management system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading settings...</span>
            </div>
          ) : (
            <>
              {/* Settings Form */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="borrowingLimit">Maximum Borrowing Limit</Label>
                  <Input
                    id="borrowingLimit"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.borrowingLimit}
                    onChange={(e) => handleInputChange('borrowingLimit', e.target.value)}
                    placeholder="Enter maximum books per user"
                  />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of books a user can borrow at once (1-50)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loanPeriodDays">Loan Period (Days)</Label>
                  <Input
                    id="loanPeriodDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.loanPeriodDays}
                    onChange={(e) => handleInputChange('loanPeriodDays', e.target.value)}
                    placeholder="Enter loan period in days"
                  />
                  <p className="text-xs text-muted-foreground">
                    Default number of days for book loans (1-365)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="finePerDay">Fine Per Day</Label>
                  <Input
                    id="finePerDay"
                    type="number"
                    min="0"
                    max="1000"
                    step="0.01"
                    value={formData.finePerDay}
                    onChange={(e) => handleInputChange('finePerDay', e.target.value)}
                    placeholder="Enter fine amount per day"
                  />
                  <p className="text-xs text-muted-foreground">
                    Fine amount charged per day for overdue books ($0-$1000)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handleResetToDefaults}
                  disabled={isUpdating}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset to Defaults
                </Button>

                <div className="flex items-center space-x-4">
                  {hasChanges && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                      <span>You have unsaved changes</span>
                    </div>
                  )}
                  <Button
                    onClick={handleSaveSettings}
                    disabled={!hasChanges || isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Settings Information */}
      {settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Current Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Active Settings</h4>
                <div className="space-y-1 text-sm">
                  <div>Maximum Borrowing Limit: <span className="font-medium">{settings.borrowingLimit} books</span></div>
                  <div>Loan Period: <span className="font-medium">{settings.loanPeriodDays} days</span></div>
                  <div>Fine Per Day: <span className="font-medium">{formatCurrency(settings.finePerDay)}</span></div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Last Updated</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{formatDate(settings.updatedAt)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {settings.updatedBy 
                        ? `${settings.updatedBy.name} (${settings.updatedBy.email})`
                        : 'System Default'
                      }
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    {getTimeAgo(settings.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
