'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Progress } from '@/app/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/app/components/ui/alert';
import { ItemStatus } from '@/app/generated/prisma';
import { ItemStatusBadge, ItemStatusIndicator } from './ItemStatusBadge';
import { 
  getStatusDisplayText, 
  getStatusBadgeColor,
  type ItemStatusInfo 
} from '@/app/lib/itemStatus';
import {
  AlertTriangle,
  BookOpen,
  TrendingUp,
  Activity,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';

interface StatusStatistics {
  statusCounts: Record<ItemStatus, number>;
  summary: {
    totalItems: number;
    totalCopies: number;
    availableCopies: number;
    borrowedCopies: number;
    overdueCopies: number;
    reservedCopies: number;
    itemsNeedingAttention: number;
  };
}

interface ItemWithStatus {
  itemId: number;
  title: string;
  author: string;
  statusInfo: ItemStatusInfo;
}

export function ItemStatusDashboard() {
  const [statistics, setStatistics] = useState<StatusStatistics | null>(null);
  const [overdueItems, setOverdueItems] = useState<ItemWithStatus[]>([]);
  const [itemsNeedingAttention, setItemsNeedingAttention] = useState<ItemWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatusData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch statistics
      const statsResponse = await fetch('/api/items/status?type=statistics');
      if (!statsResponse.ok) throw new Error('Failed to fetch statistics');
      const statsData = await statsResponse.json();
      setStatistics(statsData.data);

      // Fetch overdue items
      const overdueResponse = await fetch('/api/items/status?type=overdue');
      if (!overdueResponse.ok) throw new Error('Failed to fetch overdue items');
      const overdueData = await overdueResponse.json();
      setOverdueItems(overdueData.data.items);

      // Fetch items needing attention
      const attentionResponse = await fetch('/api/items/status?type=attention');
      if (!attentionResponse.ok) throw new Error('Failed to fetch items needing attention');
      const attentionData = await attentionResponse.json();
      setItemsNeedingAttention(attentionData.data.items);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Item Status Dashboard</h2>
          <Button disabled>
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            Loading...
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!statistics) {
    return <div>No data available</div>;
  }

  const { statusCounts, summary } = statistics;
  const utilizationRate = summary.totalCopies > 0 
    ? ((summary.borrowedCopies / summary.totalCopies) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Item Status Dashboard</h2>
          <p className="text-muted-foreground">
            Real-time overview of your library inventory status
          </p>
        </div>
        <Button onClick={fetchStatusData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {summary.totalCopies.toLocaleString()} total copies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <ItemStatusIndicator status={ItemStatus.AVAILABLE} size="md" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.availableCopies}</div>
            <p className="text-xs text-muted-foreground">
              {statusCounts[ItemStatus.AVAILABLE]} items available
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{utilizationRate}%</div>
            <Progress 
              value={parseFloat(utilizationRate)} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summary.itemsNeedingAttention}
            </div>
            <p className="text-xs text-muted-foreground">
              Items requiring action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current status of all items in inventory</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(statusCounts)
              .filter(([_, count]) => count > 0)
              .sort((a, b) => b[1] - a[1])
              .map(([status, count]) => {
                const statusEnum = status as ItemStatus;
                const percentage = ((count / summary.totalItems) * 100).toFixed(1);
                
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ItemStatusBadge 
                        status={statusEnum} 
                        size="sm"
                        showTooltip={false}
                      />
                      <span className="text-sm">{getStatusDisplayText(statusEnum)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{count}</span>
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Copy Status</CardTitle>
            <CardDescription>Distribution of individual copies</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Available Copies</span>
                <span className="font-medium text-green-600">{summary.availableCopies}</span>
              </div>
              <Progress 
                value={(summary.availableCopies / summary.totalCopies) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Borrowed Copies</span>
                <span className="font-medium text-blue-600">{summary.borrowedCopies}</span>
              </div>
              <Progress 
                value={(summary.borrowedCopies / summary.totalCopies) * 100} 
                className="h-2"
              />
            </div>

            {summary.overdueCopies > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Overdue Copies</span>
                  <span className="font-medium text-red-600">{summary.overdueCopies}</span>
                </div>
                <Progress 
                  value={(summary.overdueCopies / summary.totalCopies) * 100} 
                  className="h-2"
                />
              </div>
            )}

            {summary.reservedCopies > 0 && (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Reserved</span>
                  <span className="font-medium text-yellow-600">{summary.reservedCopies}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Tabs defaultValue="overdue" className="w-full">
        <TabsList>
          <TabsTrigger value="overdue">
            Overdue Items ({overdueItems.length})
          </TabsTrigger>
          <TabsTrigger value="attention">
            Needs Attention ({itemsNeedingAttention.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overdue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Overdue Items
              </CardTitle>
              <CardDescription>
                Items that are past their due date and need immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {overdueItems.length === 0 ? (
                <p className="text-muted-foreground">No overdue items! 🎉</p>
              ) : (
                <div className="space-y-3">
                  {overdueItems.slice(0, 10).map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">by {item.author}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.statusInfo.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ItemStatusBadge 
                          status={item.statusInfo.status}
                          statusInfo={item.statusInfo}
                          size="sm"
                        />
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                  {overdueItems.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {overdueItems.length - 10} more overdue items...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="attention" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-orange-500" />
                Items Needing Attention
              </CardTitle>
              <CardDescription>
                Items that are damaged, under maintenance, or require action
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemsNeedingAttention.length === 0 ? (
                <p className="text-muted-foreground">All items are in good condition! ✨</p>
              ) : (
                <div className="space-y-3">
                  {itemsNeedingAttention.slice(0, 10).map((item) => (
                    <div key={item.itemId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.title}</h4>
                        <p className="text-sm text-muted-foreground">by {item.author}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.statusInfo.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <ItemStatusBadge 
                          status={item.statusInfo.status}
                          statusInfo={item.statusInfo}
                          size="sm"
                        />
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </div>
                  ))}
                  {itemsNeedingAttention.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      And {itemsNeedingAttention.length - 10} more items needing attention...
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
