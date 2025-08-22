'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen,
  RotateCcw,
  Users,
  AlertTriangle,
  Library,
  LogOut
} from 'lucide-react';

const librarianNavItems = [
  {
    title: 'Dashboard',
    href: '/librarian/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Book Cataloging',
    href: '/librarian/cataloging',
    icon: BookOpen,
  },
  {
    title: 'Circulation',
    href: '/librarian/circulation',
    icon: RotateCcw,
  },
  {
    title: 'Patron Management',
    href: '/librarian/patrons',
    icon: Users,
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
        <div className="flex items-center space-x-2">
          <Library className="h-8 w-8 text-blue-600" />
          <div>
            <h2 className="font-semibold text-lg">Librarian Panel</h2>
            <p className="text-sm text-gray-500">Library Operations</p>
          </div>
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
                  'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-blue-600' : 'text-gray-400')} />
                <span>{item.title}</span>
                {item.title === 'Overdue Management' && (
                  <Badge className="bg-red-100 text-red-800 text-xs">23</Badge>
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
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <BookOpen className="mr-2 h-3 w-3" />
            Issue Book
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            <RotateCcw className="mr-2 h-3 w-3" />
            Return Book
          </Button>
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
