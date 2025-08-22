'use client';

import { ItemStatus } from '@/app/generated/prisma';
import { Badge } from '@/app/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/app/components/ui/tooltip';
import { 
  getStatusBadgeColor, 
  getStatusDisplayText,
  type ItemStatusInfo 
} from '@/app/lib/itemStatus';
import { 
  CheckCircle, 
  BookOpen, 
  Clock, 
  AlertTriangle, 
  Settings, 
  XCircle, 
  Archive,
  AlertCircle 
} from 'lucide-react';

interface ItemStatusBadgeProps {
  status: ItemStatus;
  statusInfo?: ItemStatusInfo;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showTooltip?: boolean;
  className?: string;
}

const statusIcons = {
  [ItemStatus.AVAILABLE]: CheckCircle,
  [ItemStatus.BORROWED]: BookOpen,
  [ItemStatus.RESERVED]: Clock,
  [ItemStatus.OVERDUE]: AlertTriangle,
  [ItemStatus.UNDER_MAINTENANCE]: Settings,
  [ItemStatus.DAMAGED]: XCircle,
  [ItemStatus.LOST]: Archive,
  [ItemStatus.OUT_OF_STOCK]: AlertCircle,
};

export function ItemStatusBadge({
  status,
  statusInfo,
  size = 'md',
  showIcon = true,
  showTooltip = true,
  className = ''
}: ItemStatusBadgeProps) {
  const Icon = statusIcons[status];
  const badgeColor = getStatusBadgeColor(status);
  const displayText = getStatusDisplayText(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  const badge = (
    <Badge 
      variant="outline" 
      className={`
        ${badgeColor} 
        ${sizeClasses[size]} 
        ${className}
        flex items-center gap-1.5 font-medium border
      `}
    >
      {showIcon && Icon && (
        <Icon className={iconSizeClasses[size]} />
      )}
      {displayText}
    </Badge>
  );

  if (!showTooltip || !statusInfo) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">{displayText}</p>
            <p className="text-sm text-muted-foreground">
              {statusInfo.description}
            </p>
            {(statusInfo.borrowedCopies > 0 || statusInfo.reservedCopies > 0 || statusInfo.overdueCopies > 0) && (
              <div className="text-xs space-y-0.5 mt-2 pt-2 border-t">
                {statusInfo.availableCopies > 0 && (
                  <p>✅ Available: {statusInfo.availableCopies}</p>
                )}
                {statusInfo.borrowedCopies > 0 && (
                  <p>📚 Borrowed: {statusInfo.borrowedCopies}</p>
                )}
                {statusInfo.reservedCopies > 0 && (
                  <p>⏰ Reserved: {statusInfo.reservedCopies}</p>
                )}
                {statusInfo.overdueCopies > 0 && (
                  <p>⚠️ Overdue: {statusInfo.overdueCopies}</p>
                )}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Simplified status indicator for compact displays
export function ItemStatusIndicator({ 
  status, 
  size = 'sm' 
}: { 
  status: ItemStatus; 
  size?: 'xs' | 'sm' | 'md';
}) {
  const Icon = statusIcons[status];
  const badgeColor = getStatusBadgeColor(status);
  
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-3 h-3',
    md: 'w-4 h-4'
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`${badgeColor} rounded-full p-1 inline-flex items-center justify-center`}>
            {Icon && <Icon className={sizeClasses[size]} />}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          {getStatusDisplayText(status)}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Status summary component for displaying multiple statuses
export function ItemStatusSummary({ 
  statusCounts 
}: { 
  statusCounts: Record<ItemStatus, number>;
}) {
  const priorityOrder: ItemStatus[] = [
    ItemStatus.OVERDUE,
    ItemStatus.DAMAGED,
    ItemStatus.UNDER_MAINTENANCE,
    ItemStatus.OUT_OF_STOCK,
    ItemStatus.BORROWED,
    ItemStatus.RESERVED,
    ItemStatus.AVAILABLE,
    ItemStatus.LOST
  ];

  const visibleStatuses = priorityOrder.filter(status => statusCounts[status] > 0);

  if (visibleStatuses.length === 0) {
    return <span className="text-muted-foreground text-sm">No items</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {visibleStatuses.map(status => (
        <ItemStatusBadge
          key={status}
          status={status}
          size="sm"
          showIcon={false}
          showTooltip={false}
          className="font-mono"
        />
      )).slice(0, 3)}
      {visibleStatuses.length > 3 && (
        <Badge variant="outline" className="text-xs px-2 py-1 bg-muted">
          +{visibleStatuses.length - 3} more
        </Badge>
      )}
    </div>
  );
}
