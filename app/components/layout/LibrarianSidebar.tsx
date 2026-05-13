'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/app/contexts/AuthContext';
import { NotificationBell } from '@/app/components/notifications/NotificationBell';
import { 
  LayoutDashboard, 
  BookOpen,
  RotateCcw,
  Users,
  AlertTriangle,
  Library,
  LogOut,
  Loader2,
  Clock,
  History
} from 'lucide-react';

interface SidebarStats {
  overdueCount: number;
  totalBooks: number;
}

const librarianNavItems = [
  {
    title: 'Dashboard',
    href: '/librarian/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Patron Management',
    href: '/librarian/patrons',
    icon: Users,
  },
  {
    title: 'Borrow Requests',
    href: '/librarian/borrow-requests',
    icon: Clock,
  },
  {
    title: 'Book Cataloging',
    href: '/librarian/cataloging',
    icon: BookOpen,
  },
  {
    title: 'Transaction History',
    href: '/librarian/transaction-history',
    icon: History,
  },
  {
    title: 'Overdue Management',
    href: '/librarian/overdue',
    icon: AlertTriangle,
  },
];

export function LibrarianSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  
  const [stats, setStats] = useState<SidebarStats>({
    overdueCount: 0,
    totalBooks: 0
  });
  const [loading, setLoading] = useState(true);

  // Fetch sidebar statistics
  const fetchSidebarStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats({
            overdueCount: data.data.transactions.overdue || 0,
            totalBooks: data.data.overview.totalItems || 0
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch sidebar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchSidebarStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSidebarStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Library className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="font-semibold text-lg">Librarian Panel</h2>
              <p className="text-sm text-gray-500">Library Operations</p>
            </div>
          </div>
          <NotificationBell />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {librarianNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer',
                  active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-400')} />
                <span>{item.title}</span>
                {loading && (
                  <Loader2 className="h-3 w-3 animate-spin ml-auto" />
                )}
                {!loading && item.title === 'Overdue Management' && stats.overdueCount > 0 && (
                  <Badge className="bg-red-100 text-red-800 text-xs ml-auto">{stats.overdueCount}</Badge>
                )}
                {!loading && item.title === 'Book Cataloging' && stats.totalBooks > 0 && (
                  <Badge className="bg-purple-100 text-purple-800 text-xs ml-auto">{stats.totalBooks}</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-700 mb-3">Quick Actions</div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
