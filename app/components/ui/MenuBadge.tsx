'use client';

import React from 'react';
import { cn } from '@/app/lib/utils';
import { type MenuBadge as MenuBadgeType } from '@/app/config/adminMenuConfig';

interface MenuBadgeProps {
  badge: MenuBadgeType;
  className?: string;
}

const badgeColorClasses = {
  red: 'bg-red-500 text-white border-red-600',
  green: 'bg-green-500 text-white border-green-600',
  blue: 'bg-blue-500 text-white border-blue-600',
  yellow: 'bg-yellow-400 text-yellow-900 border-yellow-500',
  purple: 'bg-purple-500 text-white border-purple-600',
  gray: 'bg-gray-500 text-white border-gray-600'
};

const badgeTypeClasses = {
  count: 'px-2 py-0.5 text-xs font-semibold rounded-full min-w-[20px] flex items-center justify-center',
  status: 'px-2 py-0.5 text-xs font-medium rounded-full',
  alert: 'px-1.5 py-0.5 text-xs font-bold rounded-full min-w-[18px] flex items-center justify-center',
  new: 'px-1.5 py-0.5 text-xs font-medium rounded'
};

export const MenuBadge: React.FC<MenuBadgeProps> = ({ badge, className }) => {
  const colorClass = badgeColorClasses[badge.color || 'gray'];
  const typeClass = badgeTypeClasses[badge.type];

  // Don't render if value is 0 for count type
  if (badge.type === 'count' && (badge.value === 0 || badge.value === '0')) {
    return null;
  }

  const badgeClass = cn(
    'inline-flex items-center justify-center border transition-all duration-200',
    typeClass,
    colorClass,
    badge.animate && 'animate-pulse',
    className
  );

  const renderBadgeContent = () => {
    switch (badge.type) {
      case 'count':
        // Show abbreviated count for large numbers
        const count = typeof badge.value === 'number' ? badge.value : parseInt(badge.value?.toString() || '0');
        if (count > 999) {
          return `${(count / 1000).toFixed(1)}k`;
        } else if (count > 99) {
          return '99+';
        }
        return badge.value?.toString();

      case 'status':
        return badge.value?.toString();

      case 'alert':
        return badge.value?.toString() || '!';

      case 'new':
        return 'NEW';

      default:
        return badge.value?.toString();
    }
  };

  return (
    <span 
      className={badgeClass}
      title={badge.type === 'count' ? `${badge.value} items` : badge.value?.toString()}
    >
      {renderBadgeContent()}
    </span>
  );
};

// Animated badge for loading states
export const LoadingBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <span className={cn(
      'inline-flex items-center justify-center h-4 w-4 bg-gray-300 rounded-full animate-pulse',
      className
    )}>
      <span className="sr-only">Loading...</span>
    </span>
  );
};

// Notification dot for minimal notifications
export const NotificationDot: React.FC<{ 
  show?: boolean; 
  color?: keyof typeof badgeColorClasses;
  className?: string;
}> = ({ show = true, color = 'red', className }) => {
  if (!show) return null;

  return (
    <span 
      className={cn(
        'absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white',
        badgeColorClasses[color]?.replace('text-white', '').replace('text-yellow-900', ''),
        'animate-pulse',
        className
      )}
    >
      <span className="sr-only">New notifications</span>
    </span>
  );
};

export default MenuBadge;
