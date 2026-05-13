'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
  adminMenuConfig,
  rolePermissions,
  dynamicCounters,
  defaultMenuPreferences,
  type MenuCategory,
  type MenuItem,
  type MenuPreferences,
  type MenuBadge
} from '@/app/config/adminMenuConfig';

interface MenuState {
  categories: MenuCategory[];
  preferences: MenuPreferences;
  loading: boolean;
  error: string | null;
}

interface CounterUpdate {
  menuItemId: string;
  value: string | number;
}

export const useAdminMenu = () => {
  const { user } = useAuth();
  const [menuState, setMenuState] = useState<MenuState>({
    categories: [],
    preferences: defaultMenuPreferences,
    loading: true,
    error: null
  });

  // Store for dynamic counter intervals
  const [counterIntervals, setCounterIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());

  // Filter menu items based on user role and permissions
  const filterMenuByRole = useCallback((categories: MenuCategory[], userRole?: string): MenuCategory[] => {
    if (!userRole) return [];

    const userPermissions = rolePermissions[userRole] || [];
    const hasAccess = (itemId: string) => {
      return userPermissions.includes('*') || userPermissions.includes(itemId);
    };

    return categories.map(category => ({
      ...category,
      items: category.items.filter(item => hasAccess(item.id))
    })).filter(category => category.items.length > 0);
  }, []);

  // Apply menu preferences
  const applyPreferences = useCallback((categories: MenuCategory[], preferences: MenuPreferences): MenuCategory[] => {
    return categories.map(category => ({
      ...category,
      expanded: !preferences.collapsedCategories.includes(category.id),
      items: category.items
        .filter(item => !preferences.hiddenItems.includes(item.id))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    })).sort((a, b) => (a.order || 0) - (b.order || 0));
  }, []);

  // Update dynamic counter for specific menu item
  const updateCounter = useCallback((menuItemId: string, value: string | number) => {
    setMenuState(prev => ({
      ...prev,
      categories: prev.categories.map(category => ({
        ...category,
        items: category.items.map(item => {
          if (item.id === menuItemId && item.badge) {
            return {
              ...item,
              badge: {
                ...item.badge,
                value: value
              }
            };
          }
          return item;
        })
      }))
    }));
  }, []);

  // Fetch dynamic counter data
  const fetchCounterData = useCallback(async (counter: typeof dynamicCounters[0]) => {
    try {
      const response = await fetch(counter.apiEndpoint);
      if (response.ok) {
        const data = await response.json();
        const value = counter.transform ? counter.transform(data) : data;
        updateCounter(counter.menuItemId, value);
      }
    } catch (error) {
      console.warn(`Failed to fetch counter data for ${counter.menuItemId}:`, error);
    }
  }, [updateCounter]);

  // Setup dynamic counters
  const setupDynamicCounters = useCallback(() => {
    // Clear existing intervals
    counterIntervals.forEach(interval => clearInterval(interval));
    const newIntervals = new Map<string, NodeJS.Timeout>();

    dynamicCounters.forEach(counter => {
      // Initial fetch
      fetchCounterData(counter);

      // Setup interval for periodic updates
      if (counter.updateInterval) {
        const interval = setInterval(() => {
          fetchCounterData(counter);
        }, counter.updateInterval);
        
        newIntervals.set(counter.menuItemId, interval);
      }
    });

    setCounterIntervals(newIntervals);
  }, [counterIntervals, fetchCounterData]);

  // Load user preferences from localStorage
  const loadPreferences = useCallback((): MenuPreferences => {
    try {
      const stored = localStorage.getItem(`admin-menu-prefs-${user?.email}`);
      if (stored) {
        return { ...defaultMenuPreferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load menu preferences:', error);
    }
    return defaultMenuPreferences;
  }, [user?.email]);

  // Save preferences to localStorage
  const savePreferences = useCallback((preferences: MenuPreferences) => {
    try {
      localStorage.setItem(`admin-menu-prefs-${user?.email}`, JSON.stringify(preferences));
      setMenuState(prev => ({ ...prev, preferences }));
    } catch (error) {
      console.error('Failed to save menu preferences:', error);
    }
  }, [user?.email]);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    const newPreferences = {
      ...menuState.preferences,
      collapsedCategories: menuState.preferences.collapsedCategories.includes(categoryId)
        ? menuState.preferences.collapsedCategories.filter(id => id !== categoryId)
        : [...menuState.preferences.collapsedCategories, categoryId]
    };
    savePreferences(newPreferences);
  }, [menuState.preferences, savePreferences]);

  // Hide/show menu item
  const toggleMenuItem = useCallback((itemId: string) => {
    const newPreferences = {
      ...menuState.preferences,
      hiddenItems: menuState.preferences.hiddenItems.includes(itemId)
        ? menuState.preferences.hiddenItems.filter(id => id !== itemId)
        : [...menuState.preferences.hiddenItems, itemId]
    };
    savePreferences(newPreferences);
  }, [menuState.preferences, savePreferences]);

  // Reset preferences to default
  const resetPreferences = useCallback(() => {
    savePreferences(defaultMenuPreferences);
  }, [savePreferences]);

  // Update badge for specific menu item
  const updateBadge = useCallback((menuItemId: string, badge: Partial<MenuBadge>) => {
    setMenuState(prev => ({
      ...prev,
      categories: prev.categories.map(category => ({
        ...category,
        items: category.items.map(item => {
          if (item.id === menuItemId) {
            return {
              ...item,
              badge: item.badge ? { ...item.badge, ...badge } : badge as MenuBadge
            };
          }
          return item;
        })
      }))
    }));
  }, []);

  // Add notification to menu item
  const addNotification = useCallback((menuItemId: string, count: number = 1) => {
    updateBadge(menuItemId, {
      type: 'count',
      value: count,
      color: 'red',
      animate: true
    });
  }, [updateBadge]);

  // Clear notification from menu item
  const clearNotification = useCallback((menuItemId: string) => {
    setMenuState(prev => ({
      ...prev,
      categories: prev.categories.map(category => ({
        ...category,
        items: category.items.map(item => {
          if (item.id === menuItemId && item.badge?.type === 'count') {
            return {
              ...item,
              badge: undefined
            };
          }
          return item;
        })
      }))
    }));
  }, []);

  // Get flattened menu items (for search, etc.)
  const flattenedMenuItems = useMemo(() => {
    const items: MenuItem[] = [];
    menuState.categories.forEach(category => {
      items.push(...category.items);
    });
    return items;
  }, [menuState.categories]);

  // Search menu items
  const searchMenuItems = useCallback((query: string): MenuItem[] => {
    if (!query.trim()) return [];
    
    const searchTerm = query.toLowerCase();
    return flattenedMenuItems.filter(item => 
      item.title.toLowerCase().includes(searchTerm) ||
      item.description?.toLowerCase().includes(searchTerm)
    );
  }, [flattenedMenuItems]);

  // Initialize menu
  useEffect(() => {
    if (!user) return;

    setMenuState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const preferences = loadPreferences();
      const filteredCategories = filterMenuByRole(adminMenuConfig, user.role);
      const finalCategories = applyPreferences(filteredCategories, preferences);

      setMenuState({
        categories: finalCategories,
        preferences,
        loading: false,
        error: null
      });

      // Setup dynamic counters after menu is loaded
      setupDynamicCounters();
    } catch (error) {
      console.error('Failed to initialize admin menu:', error);
      setMenuState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load menu'
      }));
    }
  }, [user, loadPreferences, filterMenuByRole, applyPreferences, setupDynamicCounters]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      counterIntervals.forEach(interval => clearInterval(interval));
    };
  }, [counterIntervals]);

  // Re-apply preferences when they change
  useEffect(() => {
    if (!menuState.loading && user) {
      const filteredCategories = filterMenuByRole(adminMenuConfig, user.role);
      const finalCategories = applyPreferences(filteredCategories, menuState.preferences);
      
      setMenuState(prev => ({
        ...prev,
        categories: finalCategories
      }));
    }
  }, [menuState.preferences, menuState.loading, user, filterMenuByRole, applyPreferences]);

  return {
    // State
    categories: menuState.categories,
    preferences: menuState.preferences,
    loading: menuState.loading,
    error: menuState.error,
    flattenedMenuItems,

    // Actions
    toggleCategory,
    toggleMenuItem,
    resetPreferences,
    updateBadge,
    addNotification,
    clearNotification,
    searchMenuItems,
    
    // Utils
    savePreferences
  };
};
