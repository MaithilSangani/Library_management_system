'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/app/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { useAuth } from '@/app/contexts/AuthContext';
import { useAdminMenu } from '@/app/hooks/useAdminMenu';
import { MenuBadge, LoadingBadge, NotificationDot } from '@/app/components/ui/MenuBadge';
import { type MenuItem } from '@/app/config/adminMenuConfig';
import { 
  LogOut,
  Shield,
  Search,
  ChevronDown,
  ChevronRight,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  Clock,
  Sparkles
} from 'lucide-react';

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const {
    categories,
    preferences,
    loading,
    error,
    toggleCategory,
    searchMenuItems,
    resetPreferences
  } = useAdminMenu();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const searchResults = searchMenuItems(searchQuery);

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href);
  };

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  const handleMenuItemClick = (item: MenuItem) => {
    if (item.isComingSoon) {
      // Could show a toast or modal
      console.log(`${item.title} is coming soon!`);
      return;
    }
    
    if (item.onClick) {
      item.onClick();
    } else {
      router.push(item.href);
    }
  };

  const renderMenuItem = (item: MenuItem, isSearchResult = false) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    const isDisabled = item.isComingSoon;
    
    const menuItemClass = cn(
      'group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 relative',
      active
        ? 'bg-red-50 text-red-700 border border-red-200 shadow-sm'
        : isDisabled
        ? 'text-gray-400 cursor-not-allowed'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer'
    );

    const content = (
      <div className={menuItemClass} onClick={() => !isDisabled && handleMenuItemClick(item)}>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Icon className={cn(
              'h-5 w-5 transition-colors',
              active ? 'text-red-600' : isDisabled ? 'text-gray-300' : 'text-gray-400 group-hover:text-gray-600'
            )} />
            {item.badge && <NotificationDot show={item.badge.type === 'count'} color={item.badge.color} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="truncate">{item.title}</span>
              {item.isNew && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  NEW
                </span>
              )}
              {item.isComingSoon && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  Soon
                </span>
              )}
            </div>
            {preferences.showDescriptions && item.description && (
              <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-1">
          {preferences.showBadges && item.badge && (
            <MenuBadge badge={item.badge} />
          )}
        </div>
      </div>
    );

    if (isSearchResult || isDisabled) {
      return content;
    }

    return (
      <Link key={item.id} href={item.href}>
        {content}
      </Link>
    );
  };

  const renderCategory = (category: typeof categories[0]) => {
    const CategoryIcon = category.icon;
    const isExpanded = category.expanded;
    
    return (
      <div key={category.id} className="mb-4">
        <button
          onClick={() => toggleCategory(category.id)}
          className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-700 transition-colors"
        >
          <div className="flex items-center space-x-2">
            {CategoryIcon && <CategoryIcon className="h-4 w-4" />}
            <span>{category.title}</span>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        
        {isExpanded && (
          <div className="mt-2 space-y-1">
            {category.items.map(item => (
              <div key={item.id}>
                {renderMenuItem(item)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="font-semibold text-lg">Admin Panel</h2>
              <p className="text-sm text-gray-500">Loading...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-10 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h2 className="font-semibold text-lg">Admin Panel</h2>
              <p className="text-sm text-gray-500 flex items-center space-x-1">
                <span>Library Management</span>
                <Sparkles className="h-3 w-3 text-yellow-500" title="Dynamic Menu" />
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPreferences(!showPreferences)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Menu Settings"
          >
            <Settings className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Menu Settings</h3>
            <button
              onClick={resetPreferences}
              className="flex items-center space-x-2 text-xs text-gray-600 hover:text-gray-900 transition-colors"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset to Default</span>
            </button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {error ? (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">Failed to load menu</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-600 hover:text-red-700 mt-1"
            >
              Retry
            </button>
          </div>
        ) : searchQuery && searchResults.length > 0 ? (
          <div>
            <div className="mb-3">
              <p className="text-xs text-gray-500">Search Results ({searchResults.length})</p>
            </div>
            <div className="space-y-1">
              {searchResults.map(item => (
                <div key={item.id}>
                  {renderMenuItem(item, true)}
                </div>
              ))}
            </div>
          </div>
        ) : searchQuery && searchResults.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No menu items found</p>
            <p className="text-xs">Try a different search term</p>
          </div>
        ) : (
          categories.map(category => renderCategory(category))
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <span>System Status</span>
              <Clock className="h-3 w-3" />
            </div>
            <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
          </div>
          <div className="text-xs text-gray-400">
            <p>Role: <span className="font-medium text-gray-600">{user?.role}</span></p>
            <p>Menu: <span className="font-medium text-gray-600">{categories.length} sections</span></p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start h-8 text-sm"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
