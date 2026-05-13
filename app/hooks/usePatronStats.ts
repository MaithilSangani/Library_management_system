'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

export interface PatronStats {
  totalBorrowed: number;
  overdueBooks: number;
  totalFines: number;
  booksRead: number;
  currentBorrowingLimit: number;
  reservations: number;
}

export interface UsePatronStatsReturn {
  stats: PatronStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const defaultStats: PatronStats = {
  totalBorrowed: 0,
  overdueBooks: 0,
  totalFines: 0,
  booksRead: 0,
  currentBorrowingLimit: 5,
  reservations: 0
};

export function usePatronStats(): UsePatronStatsReturn {
  const { user } = useAuth();
  const [stats, setStats] = useState<PatronStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user?.patronId) {
      setStats(defaultStats);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch patron's book data (includes stats)
      const booksResponse = await fetch(`/api/patron/books?patronId=${user.patronId}`);
      
      if (!booksResponse.ok) {
        throw new Error('Failed to fetch patron statistics');
      }

      const booksData = await booksResponse.json();
      
      // For now, we'll use the stats from the books API
      // TODO: Add separate endpoints for reservations when implemented
      const patronStats: PatronStats = {
        totalBorrowed: booksData.stats.totalBorrowed,
        overdueBooks: booksData.stats.overdueBooks,
        totalFines: booksData.stats.totalFines,
        booksRead: booksData.stats.booksRead,
        currentBorrowingLimit: booksData.stats.currentBorrowingLimit,
        reservations: 0 // TODO: Implement when reservation API is ready
      };

      setStats(patronStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load patron statistics';
      setError(errorMessage);
      console.error('Error fetching patron stats:', err);
      // Set default stats on error to prevent broken UI
      setStats(defaultStats);
    } finally {
      setLoading(false);
    }
  }, [user?.patronId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = useCallback(async () => {
    await fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch
  };
}
