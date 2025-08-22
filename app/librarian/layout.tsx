'use client';

import { useAuth } from '../contexts/AuthContext';
import { redirect } from 'next/navigation';
import { LibrarianSidebar } from '../components/layout/LibrarianSidebar';

interface LibrarianLayoutProps {
  children: React.ReactNode;
}

export default function LibrarianLayout({ children }: LibrarianLayoutProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user || (user.role !== 'LIBRARIAN' && user.role !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <LibrarianSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
