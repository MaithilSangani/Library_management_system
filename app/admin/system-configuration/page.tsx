'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Switch } from '@/app/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Separator } from '@/app/components/ui/separator';
import { Save, RefreshCw } from 'lucide-react';

interface SystemConfig {
  borrowingLimits: {
    maxBooksPerPatron: number;
    maxRenewalCount: number;
    defaultLoanPeriod: number;
  };
  fineSettings: {
    dailyFineRate: number;
    maxFineAmount: number;
    gracePeriodDays: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    overdueReminders: boolean;
    reminderDaysBefore: number;
  };
  libraryInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    operatingHours: string;
  };
}

export default function SystemConfiguration() {
  const [config, setConfig] = useState<SystemConfig>({
    borrowingLimits: {
      maxBooksPerPatron: 5,
      maxRenewalCount: 2,
      defaultLoanPeriod: 14
    },
    fineSettings: {
      dailyFineRate: 0.50,
      maxFineAmount: 25.00,
      gracePeriodDays: 3
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      overdueReminders: true,
      reminderDaysBefore: 3
    },
    libraryInfo: {
      name: 'Central Library',
      address: '123 Library Street, City, State 12345',
      phone: '(555) 123-4567',
      email: 'info@centrallibrary.com',
      website: 'www.centrallibrary.com',
      operatingHours: 'Mon-Fri: 8AM-8PM, Sat-Sun: 10AM-6PM'
    }
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground">
            Manage library settings and configurations
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <Tabs defaultValue="borrowing" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="borrowing">Borrowing</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="library-info">Library Info</TabsTrigger>
        </TabsList>

        <TabsContent value="borrowing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Borrowing Limits</CardTitle>
              <CardDescription>
                Configure borrowing limits and loan periods for library patrons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxBooks">Maximum Books per Patron</Label>
                  <Input
                    id="maxBooks"
                    type="number"
                    value={config.borrowingLimits.maxBooksPerPatron}
                    onChange={(e) => updateConfig('borrowingLimits', 'maxBooksPerPatron', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of books a patron can borrow at once
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxRenewals">Maximum Renewal Count</Label>
                  <Input
                    id="maxRenewals"
                    type="number"
                    value={config.borrowingLimits.maxRenewalCount}
                    onChange={(e) => updateConfig('borrowingLimits', 'maxRenewalCount', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum number of times a book can be renewed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="loanPeriod">Default Loan Period (Days)</Label>
                  <Input
                    id="loanPeriod"
                    type="number"
                    value={config.borrowingLimits.defaultLoanPeriod}
                    onChange={(e) => updateConfig('borrowingLimits', 'defaultLoanPeriod', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Default number of days for book loans
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fine Settings</CardTitle>
              <CardDescription>
                Configure fine rates and policies for overdue items
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dailyFine">Daily Fine Rate ($)</Label>
                  <Input
                    id="dailyFine"
                    type="number"
                    step="0.01"
                    value={config.fineSettings.dailyFineRate}
                    onChange={(e) => updateConfig('fineSettings', 'dailyFineRate', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Amount charged per day for overdue items
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxFine">Maximum Fine Amount ($)</Label>
                  <Input
                    id="maxFine"
                    type="number"
                    step="0.01"
                    value={config.fineSettings.maxFineAmount}
                    onChange={(e) => updateConfig('fineSettings', 'maxFineAmount', parseFloat(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Maximum fine that can be charged per item
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={config.fineSettings.gracePeriodDays}
                    onChange={(e) => updateConfig('fineSettings', 'gracePeriodDays', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    Number of days before fines start accruing
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how and when the system sends notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'emailNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.smsNotifications}
                    onCheckedChange={(checked) => updateConfig('notifications', 'smsNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Overdue Reminders</Label>
                    <p className="text-sm text-muted-foreground">
                      Send reminders for overdue items
                    </p>
                  </div>
                  <Switch
                    checked={config.notifications.overdueReminders}
                    onCheckedChange={(checked) => updateConfig('notifications', 'overdueReminders', checked)}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="reminderDays">Reminder Days Before Due</Label>
                    <Input
                      id="reminderDays"
                      type="number"
                      value={config.notifications.reminderDaysBefore}
                      onChange={(e) => updateConfig('notifications', 'reminderDaysBefore', parseInt(e.target.value))}
                    />
                    <p className="text-sm text-muted-foreground">
                      Days before due date to send reminders
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library-info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Library Information</CardTitle>
              <CardDescription>
                Update general library information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="libraryName">Library Name</Label>
                  <Input
                    id="libraryName"
                    value={config.libraryInfo.name}
                    onChange={(e) => updateConfig('libraryInfo', 'name', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={config.libraryInfo.phone}
                    onChange={(e) => updateConfig('libraryInfo', 'phone', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={config.libraryInfo.email}
                    onChange={(e) => updateConfig('libraryInfo', 'email', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={config.libraryInfo.website}
                    onChange={(e) => updateConfig('libraryInfo', 'website', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={config.libraryInfo.address}
                  onChange={(e) => updateConfig('libraryInfo', 'address', e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="hours">Operating Hours</Label>
                <Textarea
                  id="hours"
                  value={config.libraryInfo.operatingHours}
                  onChange={(e) => updateConfig('libraryInfo', 'operatingHours', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
