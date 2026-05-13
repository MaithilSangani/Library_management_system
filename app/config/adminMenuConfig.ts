import { 
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  Database,
  Shield,
  BookOpen,
  CreditCard,
  Bell,
  UserCog,
  FileText,
  Activity,
  Archive,
  Key,
  Globe,
  Mail,
  Calendar,
  AlertTriangle,
  Zap,
  Clock,
  TrendingUp,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  Monitor,
  Sliders,
  LucideIcon
} from 'lucide-react';

export interface MenuBadge {
  type: 'count' | 'status' | 'alert' | 'new';
  value?: string | number;
  color?: 'red' | 'green' | 'blue' | 'yellow' | 'purple' | 'gray';
  animate?: boolean;
}

export interface MenuItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  badge?: MenuBadge;
  permission?: string[];
  roles?: string[];
  isNew?: boolean;
  isComingSoon?: boolean;
  order?: number;
  category?: string;
  subItems?: MenuItem[];
  onClick?: () => void;
}

export interface MenuCategory {
  id: string;
  title: string;
  icon?: LucideIcon;
  expanded?: boolean;
  order?: number;
  items: MenuItem[];
}

export const adminMenuConfig: MenuCategory[] = [
  {
    id: 'overview',
    title: 'Overview',
    icon: LayoutDashboard,
    expanded: true,
    order: 1,
    items: [
      {
        id: 'dashboard',
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        description: 'System overview and key metrics',
        badge: {
          type: 'status',
          value: 'Live',
          color: 'green',
          animate: true
        },
        order: 1
      },
      {
        id: 'analytics',
        title: 'Analytics',
        href: '/admin/reports-analytics',
        icon: TrendingUp,
        description: 'Reports and system analytics',
        badge: {
          type: 'count',
          value: 12,
          color: 'blue'
        },
        order: 2
      }
    ]
  },
  {
    id: 'user_management',
    title: 'User Management',
    icon: Users,
    expanded: true,
    order: 2,
    items: [
      {
        id: 'users',
        title: 'Users',
        href: '/admin/user-management',
        icon: Users,
        description: 'Manage system users and roles',
        badge: {
          type: 'count',
          value: 0, // Will be dynamically updated
          color: 'purple'
        },
        order: 1
      },
      {
        id: 'roles_permissions',
        title: 'Roles & Permissions',
        href: '/admin/roles-permissions',
        icon: Shield,
        description: 'Configure user roles and permissions',
        isComingSoon: true,
        order: 2
      },
      {
        id: 'user_activity',
        title: 'User Activity',
        href: '/admin/user-activity',
        icon: Activity,
        description: 'Monitor user activity and sessions',
        isComingSoon: true,
        order: 3
      }
    ]
  },
  {
    id: 'library_management',
    title: 'Library Management',
    icon: BookOpen,
    expanded: false,
    order: 3,
    items: [
      {
        id: 'books_catalog',
        title: 'Books Catalog',
        href: '/admin/books-catalog',
        icon: BookOpen,
        description: 'Manage library book inventory',
        badge: {
          type: 'status',
          value: 'Active',
          color: 'green'
        },
        order: 1
      },
      {
        id: 'transactions',
        title: 'Transactions',
        href: '/admin/transactions',
        icon: Clock,
        description: 'View and manage book transactions',
        isComingSoon: true,
        order: 2
      },
      {
        id: 'fines_payments',
        title: 'Fines & Payments',
        href: '/admin/fines-payments',
        icon: CreditCard,
        description: 'Manage fines and payment processing',
        badge: {
          type: 'alert',
          value: '!',
          color: 'yellow'
        },
        isComingSoon: true,
        order: 3
      }
    ]
  },
  {
    id: 'system',
    title: 'System',
    icon: Settings,
    expanded: false,
    order: 4,
    items: [
      {
        id: 'system_config',
        title: 'Configuration',
        href: '/admin/system-configuration',
        icon: Settings,
        description: 'System settings and configuration',
        order: 1
      },
      {
        id: 'notifications',
        title: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
        description: 'Manage system notifications',
        badge: {
          type: 'count',
          value: 3,
          color: 'red',
          animate: true
        },
        isComingSoon: true,
        order: 2
      },
      {
        id: 'email_templates',
        title: 'Email Templates',
        href: '/admin/email-templates',
        icon: Mail,
        description: 'Configure email templates',
        isComingSoon: true,
        order: 3
      },
      {
        id: 'system_logs',
        title: 'System Logs',
        href: '/admin/system-logs',
        icon: FileText,
        description: 'View system logs and events',
        isComingSoon: true,
        order: 4
      },
      {
        id: 'system_management',
        title: 'System Management',
        href: '/admin/system-management',
        icon: HardDrive,
        description: 'Manage system resources, logs, notifications, and maintenance',
        badge: {
          type: 'new',
          value: 'NEW',
          color: 'blue'
        },
        order: 5
      }
    ]
  },
  {
    id: 'data_management',
    title: 'Data Management',
    icon: Database,
    expanded: false,
    order: 5,
    items: [
      {
        id: 'backup_restore',
        title: 'Backup & Restore',
        href: '/admin/backup-restore',
        icon: Database,
        description: 'Database backup and restore operations',
        order: 1
      },
      {
        id: 'data_import',
        title: 'Data Import',
        href: '/admin/data-import',
        icon: Upload,
        description: 'Import data from external sources',
        isComingSoon: true,
        order: 2
      },
      {
        id: 'data_export',
        title: 'Data Export',
        href: '/admin/data-export',
        icon: Download,
        description: 'Export system data',
        isComingSoon: true,
        order: 3
      },
      {
        id: 'data_cleanup',
        title: 'Data Cleanup',
        href: '/admin/data-cleanup',
        icon: RefreshCw,
        description: 'Clean up and maintain data integrity',
        isComingSoon: true,
        order: 4
      }
    ]
  },
  {
    id: 'monitoring',
    title: 'Monitoring',
    icon: Monitor,
    expanded: false,
    order: 6,
    items: [
      {
        id: 'system_status',
        title: 'System Status',
        href: '/admin/system-status',
        icon: Monitor,
        description: 'Real-time system health monitoring',
        badge: {
          type: 'status',
          value: 'Online',
          color: 'green'
        },
        isComingSoon: true,
        order: 1
      },
      {
        id: 'performance',
        title: 'Performance',
        href: '/admin/performance',
        icon: Zap,
        description: 'System performance metrics',
        isComingSoon: true,
        order: 2
      },
      {
        id: 'error_tracking',
        title: 'Error Tracking',
        href: '/admin/error-tracking',
        icon: AlertTriangle,
        description: 'Monitor and track system errors',
        badge: {
          type: 'count',
          value: 0,
          color: 'red'
        },
        isComingSoon: true,
        order: 3
      }
    ]
  }
];

// Role-based permissions
export const rolePermissions: Record<string, string[]> = {
  SUPER_ADMIN: ['*'], // Access to everything
  ADMIN: [
    'dashboard',
    'analytics',
    'users',
    'system_config',
    'backup_restore',
    'books_catalog',
    'transactions',
    'fines_payments'
  ],
  MODERATOR: [
    'dashboard',
    'users',
    'books_catalog',
    'transactions'
  ],
  VIEWER: [
    'dashboard',
    'analytics'
  ]
};

// Dynamic counters configuration
export interface DynamicCounter {
  menuItemId: string;
  apiEndpoint: string;
  updateInterval?: number; // in milliseconds
  transform?: (data: any) => string | number;
}

export const dynamicCounters: DynamicCounter[] = [
  {
    menuItemId: 'users',
    apiEndpoint: '/api/admin/stats/users-count',
    updateInterval: 30000, // Update every 30 seconds
    transform: (data) => data.totalUsers || 0
  },
  {
    menuItemId: 'notifications',
    apiEndpoint: '/api/admin/stats/unread-notifications',
    updateInterval: 10000, // Update every 10 seconds
    transform: (data) => data.unreadCount || 0
  },
  {
    menuItemId: 'error_tracking',
    apiEndpoint: '/api/admin/stats/error-count',
    updateInterval: 20000, // Update every 20 seconds
    transform: (data) => data.errorCount || 0
  }
];

// Menu customization preferences
export interface MenuPreferences {
  collapsedCategories: string[];
  hiddenItems: string[];
  customOrder?: string[];
  compactMode?: boolean;
  showDescriptions?: boolean;
  showBadges?: boolean;
}

export const defaultMenuPreferences: MenuPreferences = {
  collapsedCategories: ['library_management', 'system', 'data_management', 'monitoring'],
  hiddenItems: [],
  compactMode: false,
  showDescriptions: true,
  showBadges: true
};
