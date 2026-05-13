import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface DateRange {
  start: string;
  end: string;
}

interface OverviewData {
  totalUsers: number;
  totalBooks: number;
  activeTransactions: number;
  completedTransactions: number;
  overdueBooks: number;
  totalFines: number;
  paidFines: number;
  pendingRequests: number;
  newUsersInPeriod: number;
  transactionsInPeriod: number;
  overdueRate: string;
  collectionRate: string;
}

interface TransactionData {
  transactionsByMonth: Array<{ month: string; count: number }>;
  transactionsByStatus: Array<{ status: string; count: number }>;
  topBorrowedBooks: Array<{ title: string; author: string; borrowCount: number }>;
  averageLoanDuration: number;
  returnRates: {
    returned: number;
    active: number;
    overdue: number;
    total: number;
  };
}

interface UserData {
  userGrowth: Array<{ month: string; count: number }>;
  usersByType: {
    admin: number;
    librarian: number;
    patron: number;
  };
  activePatronsCount: number;
  topPatrons: Array<{ name: string; email: string; transactionCount: number }>;
  studentVsFaculty: Array<{ type: string; count: number }>;
}

interface BookData {
  booksByCategory: Array<{ category: string; count: number }>;
  bookUtilization: Array<{
    itemId: number;
    title: string;
    author: string;
    borrowCount: number;
    totalCopies: number;
    availableCopies: number;
  }>;
  topAuthors: Array<{ author: string; borrowCount: number; bookCount: number }>;
  collectionStats: {
    totalBooks: number;
    totalCopies: number;
    availableCopies: number;
    averagePrice: number;
  };
  borrowingTrends: Array<{ itemType: string; borrowCount: number }>;
}

interface FinancialData {
  revenueByMonth: Array<{ month: string; revenue: number }>;
  paymentsByType: Array<{ type: string; amount: number; count: number }>;
  fineCollection: {
    collected: number;
    total: number;
    paidCount: number;
    totalCount: number;
  };
  outstandingPayments: {
    amount: number;
    count: number;
  };
  paymentMethods: Array<{ paymentMethod: string; count: number; total: number }>;
}

interface TrendsData {
  dailyActivity: Array<{ date: string; transactions: number }>;
  popularTimes: Array<{ hour: number; count: number }>;
  seasonalTrends: Array<{ month: number; count: number; average: number }>;
  growthMetrics: Array<{ metric: string; current_period: number }>;
}

interface ReportData {
  overview?: OverviewData;
  transactions?: TransactionData;
  users?: UserData;
  books?: BookData;
  financials?: FinancialData;
  trends?: TrendsData;
}

interface ReportsState {
  data: ReportData;
  loading: boolean;
  error: string | null;
  activeReport: string;
  dateRange: DateRange;
}

export function useReports() {
  const [state, setState] = useState<ReportsState>({
    data: {},
    loading: false,
    error: null,
    activeReport: 'overview',
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
      end: new Date().toISOString().split('T')[0] // today
    }
  });

  // Fetch report data
  const fetchReport = useCallback(async (reportType: string, dateRange?: DateRange) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          dateRange: dateRange || state.dateRange
        }),
      });

      const result = await response.json();

      if (result.success) {
        setState(prev => ({
          ...prev,
          data: { ...prev.data, [reportType]: result.data },
          loading: false,
        }));
      } else {
        throw new Error(result.error || `Failed to fetch ${reportType} report`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to fetch ${reportType} report`;
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      toast.error(errorMessage);
    }
  }, [state.dateRange]);

  // Set active report
  const setActiveReport = useCallback((reportType: string) => {
    setState(prev => ({
      ...prev,
      activeReport: reportType
    }));

    // Fetch data if not already loaded
    if (!state.data[reportType as keyof ReportData]) {
      fetchReport(reportType);
    }
  }, [fetchReport, state.data]);

  // Update date range and refetch current report
  const updateDateRange = useCallback((newDateRange: DateRange) => {
    setState(prev => ({
      ...prev,
      dateRange: newDateRange,
      data: {} // Clear existing data to force refetch
    }));

    // Refetch current active report with new date range
    fetchReport(state.activeReport, newDateRange);
  }, [fetchReport, state.activeReport]);

  // Export data as CSV
  const exportToCSV = useCallback((data: any[], filename: string) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values that might contain commas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : String(value || '');
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`${filename} exported successfully`);
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }, []);

  // Format percentage
  const formatPercentage = useCallback((value: number | string, decimals: number = 1): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return `${num.toFixed(decimals)}%`;
  }, []);

  // Format large numbers
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }, []);

  // Generate date range options
  const getDateRangeOptions = useCallback(() => {
    const today = new Date();
    const options = [
      {
        label: 'Last 7 days',
        value: 'last7days',
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Last 30 days',
        value: 'last30days',
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Last 3 months',
        value: 'last3months',
        start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Last 6 months',
        value: 'last6months',
        start: new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      },
      {
        label: 'Last year',
        value: 'lastyear',
        start: new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: today.toISOString().split('T')[0]
      }
    ];
    return options;
  }, []);

  // Apply predefined date range
  const applyDateRangeOption = useCallback((option: string) => {
    const ranges = getDateRangeOptions();
    const selectedRange = ranges.find(r => r.value === option);
    
    if (selectedRange) {
      updateDateRange({
        start: selectedRange.start,
        end: selectedRange.end
      });
    }
  }, [getDateRangeOptions, updateDateRange]);

  // Get chart colors
  const getChartColors = useCallback(() => {
    return [
      '#3b82f6', // blue
      '#ef4444', // red
      '#22c55e', // green
      '#f59e0b', // amber
      '#8b5cf6', // violet
      '#06b6d4', // cyan
      '#84cc16', // lime
      '#f97316', // orange
      '#ec4899', // pink
      '#64748b'  // slate
    ];
  }, []);

  // Load initial overview report
  useEffect(() => {
    if (!state.data.overview) {
      fetchReport('overview');
    }
  }, [fetchReport, state.data.overview]);

  return {
    ...state,
    fetchReport,
    setActiveReport,
    updateDateRange,
    applyDateRangeOption,
    exportToCSV,
    formatCurrency,
    formatPercentage,
    formatNumber,
    getDateRangeOptions,
    getChartColors,
  };
}

export type { 
  DateRange, 
  OverviewData, 
  TransactionData, 
  UserData, 
  BookData, 
  FinancialData, 
  TrendsData,
  ReportData 
};
