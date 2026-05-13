'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import {
  Download,
  FileText,
  BarChart3,
  Users,
  BookOpen,
  DollarSign,
  Calendar,
  Mail,
  Printer,
  Share
} from 'lucide-react';
import { toast } from 'sonner';

interface ReportGeneratorProps {
  data: any;
}

type ReportType = 'usage' | 'financial' | 'user' | 'inventory' | 'overdue' | 'comprehensive';
type ReportFormat = 'json' | 'csv' | 'pdf';

const reportTypes = [
  {
    id: 'usage' as ReportType,
    title: 'Usage Report',
    description: 'Library usage statistics and trends',
    icon: BarChart3,
    color: 'text-blue-600'
  },
  {
    id: 'financial' as ReportType,
    title: 'Financial Report',
    description: 'Fines, payments, and revenue analysis',
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    id: 'user' as ReportType,
    title: 'User Activity Report',
    description: 'Patron registration and activity patterns',
    icon: Users,
    color: 'text-purple-600'
  },
  {
    id: 'inventory' as ReportType,
    title: 'Inventory Report',
    description: 'Item catalog and condition analysis',
    icon: BookOpen,
    color: 'text-orange-600'
  },
  {
    id: 'overdue' as ReportType,
    title: 'Overdue Items Report',
    description: 'Outstanding books and penalty tracking',
    icon: Calendar,
    color: 'text-red-600'
  },
  {
    id: 'comprehensive' as ReportType,
    title: 'Comprehensive Report',
    description: 'Complete system overview and analytics',
    icon: FileText,
    color: 'text-gray-600'
  }
];

export function ReportGenerator({ data }: ReportGeneratorProps) {
  const [selectedType, setSelectedType] = useState<ReportType | null>(null);
  const [format, setFormat] = useState<ReportFormat>('json');
  const [customNotes, setCustomNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const generateReport = (type: ReportType, format: ReportFormat) => {
    setGenerating(true);

    try {
      let reportData: any = {};
      const timestamp = new Date().toISOString();
      
      // Generate report based on type
      switch (type) {
        case 'usage':
          reportData = {
            title: 'Library Usage Report',
            generatedAt: timestamp,
            period: 'Current Period',
            summary: {
              totalTransactions: data.transactions.total,
              activeTransactions: data.transactions.active,
              dailyAverage: Math.round(data.transactions.thisMonth / 30),
              utilizationRate: data.overview.utilizationRate
            },
            trends: data.trends.daily,
            popularItems: data.items.mostBorrowed,
            itemTypes: data.items.byType,
            customNotes
          };
          break;

        case 'financial':
          reportData = {
            title: 'Financial Report',
            generatedAt: timestamp,
            period: 'Current Period',
            summary: {
              totalFinesOwed: data.finances.totalFinesOwed,
              finesPaid: data.finances.finesPaid,
              pendingPayments: data.finances.pendingPayments,
              estimatedRevenue: data.finances.finesPaid + data.finances.totalFinesOwed
            },
            breakdown: {
              collectionRate: data.finances.finesPaid > 0 ? 
                ((data.finances.finesPaid / (data.finances.finesPaid + data.finances.totalFinesOwed)) * 100).toFixed(2) + '%' : 
                'N/A',
              averageFinePerItem: data.transactions.overdue > 0 ? 
                (data.finances.estimatedOverdueAmount / data.transactions.overdue).toFixed(2) : 
                '0'
            },
            customNotes
          };
          break;

        case 'user':
          reportData = {
            title: 'User Activity Report',
            generatedAt: timestamp,
            period: 'Current Period',
            summary: {
              totalUsers: data.users.total,
              newUsersToday: data.users.newToday,
              newUsersThisWeek: data.users.newThisWeek,
              activeUsers: data.users.activeUsers
            },
            growth: {
              dailyGrowthRate: data.users.newToday,
              weeklyGrowthRate: data.users.newThisWeek
            },
            engagement: {
              averageTransactionsPerUser: data.users.total > 0 ? 
                (data.transactions.total / data.users.total).toFixed(2) : 
                '0'
            },
            customNotes
          };
          break;

        case 'inventory':
          reportData = {
            title: 'Inventory Report',
            generatedAt: timestamp,
            period: 'Current Period',
            summary: {
              totalItems: data.overview.totalItems,
              availableItems: data.overview.availableItems,
              itemsInCirculation: data.transactions.active,
              lowStockItems: data.alerts.lowStock
            },
            breakdown: {
              byType: data.items.byType,
              byCondition: data.items.byCondition,
              utilizationRate: data.overview.utilizationRate + '%'
            },
            recommendations: [
              data.alerts.lowStock > 0 ? `${data.alerts.lowStock} item types need restocking` : null,
              data.overview.utilizationRate > 90 ? 'Consider expanding collection' : null,
              data.items.byCondition.find(c => c.condition === 'POOR')?.count > 0 ? 'Items in poor condition need attention' : null
            ].filter(Boolean),
            customNotes
          };
          break;

        case 'overdue':
          reportData = {
            title: 'Overdue Items Report',
            generatedAt: timestamp,
            period: 'Current Period',
            summary: {
              totalOverdueItems: data.transactions.overdue,
              estimatedFines: data.finances.estimatedOverdueAmount,
              averageDaysOverdue: 'N/A', // Would need more data
              affectedUsers: Math.ceil(data.transactions.overdue * 0.7) // Estimate
            },
            severity: {
              critical: Math.ceil(data.transactions.overdue * 0.3),
              moderate: Math.ceil(data.transactions.overdue * 0.4),
              minor: Math.floor(data.transactions.overdue * 0.3)
            },
            actions: [
              'Send overdue notifications',
              'Process fine collections',
              'Consider item replacement for lost books',
              'Review lending policies'
            ],
            customNotes
          };
          break;

        case 'comprehensive':
          reportData = {
            title: 'Comprehensive Library Report',
            generatedAt: timestamp,
            period: 'Current Period',
            executiveSummary: {
              totalItems: data.overview.totalItems,
              totalUsers: data.users.total,
              activeTransactions: data.transactions.active,
              systemHealth: data.alerts.systemHealth,
              overallPerformance: 'Good' // Could be calculated based on metrics
            },
            sections: {
              usage: {
                totalTransactions: data.transactions.total,
                utilizationRate: data.overview.utilizationRate,
                trends: data.trends.daily.slice(-7)
              },
              financial: {
                totalRevenue: data.finances.finesPaid,
                outstandingFines: data.finances.totalFinesOwed,
                collectionEfficiency: data.finances.pendingPayments
              },
              users: {
                totalRegistered: data.users.total,
                newThisWeek: data.users.newThisWeek,
                activeUsers: data.users.activeUsers
              },
              inventory: {
                totalItems: data.overview.totalItems,
                itemTypes: data.items.byType,
                mostPopular: data.items.mostBorrowed.slice(0, 3)
              },
              alerts: {
                overdueItems: data.alerts.overdueBooks,
                pendingRequests: data.alerts.pendingRequests,
                systemIssues: data.alerts.lowStock
              }
            },
            recommendations: [
              data.alerts.overdueBooks > 10 ? 'Address overdue items immediately' : null,
              data.overview.utilizationRate < 50 ? 'Consider marketing campaigns to increase usage' : null,
              data.alerts.lowStock > 0 ? 'Review and restock popular items' : null,
              data.users.newThisWeek === 0 ? 'Implement user acquisition strategies' : null
            ].filter(Boolean),
            customNotes
          };
          break;
      }

      // Generate file based on format
      let fileContent: string;
      let mimeType: string;
      let extension: string;

      switch (format) {
        case 'json':
          fileContent = JSON.stringify(reportData, null, 2);
          mimeType = 'application/json';
          extension = 'json';
          break;
        case 'csv':
          // Convert to CSV format (simplified)
          fileContent = convertToCSV(reportData);
          mimeType = 'text/csv';
          extension = 'csv';
          break;
        case 'pdf':
          // For now, generate as formatted text (in real app, would use PDF library)
          fileContent = convertToFormattedText(reportData);
          mimeType = 'text/plain';
          extension = 'txt';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create and download file
      const blob = new Blob([fileContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${reportTypes.find(r => r.id === type)?.title} generated successfully!`);

    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const convertToCSV = (data: any): string => {
    // Simplified CSV conversion
    let csv = `Report: ${data.title}\nGenerated: ${data.generatedAt}\n\n`;
    
    if (data.summary) {
      csv += 'Summary\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        csv += `${key},${value}\n`;
      });
      csv += '\n';
    }

    return csv;
  };

  const convertToFormattedText = (data: any): string => {
    let text = `${data.title}\n${'='.repeat(data.title.length)}\n\n`;
    text += `Generated: ${new Date(data.generatedAt).toLocaleString()}\n`;
    text += `Period: ${data.period}\n\n`;

    if (data.summary) {
      text += 'SUMMARY\n-------\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        text += `${key}: ${value}\n`;
      });
      text += '\n';
    }

    if (data.customNotes) {
      text += 'NOTES\n-----\n';
      text += `${data.customNotes}\n\n`;
    }

    return text;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Report Generator</CardTitle>
          <CardDescription>
            Generate detailed reports and analytics for your library system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedType === report.id;
              
              return (
                <Card 
                  key={report.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-primary border-primary' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedType(report.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg bg-gray-100`}>
                        <Icon className={`h-5 w-5 ${report.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{report.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {report.description}
                        </p>
                        {isSelected && (
                          <Badge variant="default" className="mt-2 text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedType && (
            <div className="mt-6 space-y-4 p-4 border rounded-lg bg-gray-50">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Output Format</label>
                  <Select value={format} onValueChange={(value: ReportFormat) => setFormat(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="pdf">Text (.txt)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-end">
                  <Button 
                    onClick={() => generateReport(selectedType, format)}
                    disabled={generating}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Custom Notes (Optional)</label>
                <Textarea
                  placeholder="Add any custom notes or observations to include in the report..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                Report will include data up to {new Date().toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common reporting tasks and data exports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" size="sm" className="justify-start">
              <Mail className="h-4 w-4 mr-2" />
              Email Summary
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Printer className="h-4 w-4 mr-2" />
              Print Dashboard
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => generateReport('comprehensive', 'json')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export All Data
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start"
              onClick={() => generateReport('overdue', 'csv')}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Overdue List
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
