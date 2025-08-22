'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Search,
  Book,
  Clock,
  Heart,
  User,
  BookMarked,
  LogOut
} from 'lucide-react';

const patronNavItems = [
  {
    title: 'Dashboard',
    href: '/patron/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Browse Catalog',
    href: '/patron/browse',
    icon: Search,
  },
  {
    title: 'My Books',
    href: '/patron/my-books',
    icon: Book,
  },
  {
    title: 'Reservations',
    href: '/patron/reservations',
    icon: Clock,
  },
  {
    title: 'Wishlist',
    href: '/patron/wishlist',
    icon: Heart,
  },
  {
    title: 'Reading History',
    href: '/patron/history',
    icon: BookMarked,
  },
  {
    title: 'My Account',
    href: '/patron/account',
    icon: User,
  },
];

export function PatronSidebar() {
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
          <BookMarked className="h-8 w-8 text-green-600" />
          <div>
            <h2 className="font-semibold text-lg">Library Portal</h2>
            <p className="text-sm text-gray-500">Your Reading Journey</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {patronNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  active
                    ? 'bg-green-50 text-green-700 border-r-2 border-green-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-5 w-5', active ? 'text-green-600' : 'text-gray-400')} />
                <span className="flex-1">{item.title}</span>
                {item.title === 'My Books' && (
                  <Badge className="bg-blue-100 text-blue-800 text-xs">3</Badge>
                )}
                {item.title === 'Reservations' && (
                  <Badge className="bg-green-100 text-green-800 text-xs">2</Badge>
                )}
                {item.title === 'Wishlist' && (
                  <Badge className="bg-purple-100 text-purple-800 text-xs">12</Badge>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-700 mb-2">Quick Stats</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-center p-2 bg-blue-50 rounded">
              <div className="font-bold text-blue-700">3</div>
              <div className="text-blue-600">Borrowed</div>
            </div>
            <div className="text-center p-2 bg-green-50 rounded">
              <div className="font-bold text-green-700">$0</div>
              <div className="text-green-600">Fines</div>
            </div>
          </div>
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
