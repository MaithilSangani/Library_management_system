'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

export interface PaymentStats {
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  totalPaid: number;
}

export interface UsePaymentStatsReturn {
  paymentStats: PaymentStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultPaymentStats: PaymentStats = {
  pendingAmount: 0,
  pendingCount: 0,
  overdueAmount: 0,
  overdueCount: 0,
  totalPaid: 0
};

export function usePaymentStats(): UsePaymentStatsReturn {
  const { user } = useAuth();
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPaymentStats = useCallback(async () => {
    if (!user?.patronId) {
      setPaymentStats(defaultPaymentStats);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/patron/payments?patronId=${user.patronId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment statistics');
      }

      const data = await response.json();
      
      const stats: PaymentStats = {
        pendingAmount: data.stats.statusBreakdown.PENDING?.amount || 0,
        pendingCount: data.stats.statusBreakdown.PENDING?.count || 0,
        overdueAmount: data.overduePayments.reduce((sum: number, payment: any) => sum + payment.amount, 0),
        overdueCount: data.overduePayments.length,
        totalPaid: data.stats.statusBreakdown.PAID?.amount || 0
      };

      setPaymentStats(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load payment statistics';
      setError(errorMessage);
      console.error('Error fetching payment stats:', err);
      // Set default stats on error to prevent broken UI
      setPaymentStats(defaultPaymentStats);
    } finally {
      setLoading(false);
    }
  }, [user?.patronId]);

  useEffect(() => {
    fetchPaymentStats();
  }, [fetchPaymentStats]);

  const refetch = useCallback(async () => {
    await fetchPaymentStats();
  }, [fetchPaymentStats]);

  return {
    paymentStats,
    loading,
    error,
    refetch
  };
}
