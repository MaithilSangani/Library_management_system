'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { ItemStatusDashboard } from '@/app/components/items/ItemStatusDashboard';
import { Users, Book, AlertTriangle, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the administrator panel. Monitor and manage your library system.
        </p>
      </div>

      {/* Dynamic Item Status Dashboard */}
      <ItemStatusDashboard />

      {/* System Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status and performance metrics</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Database Status</h3>
                  <p className="text-sm text-muted-foreground">All systems operational</p>
                </div>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Backup Status</h3>
                  <p className="text-sm text-muted-foreground">Last backup: 2 hours ago</p>
                </div>
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium">Server Health</h3>
                  <p className="text-sm text-muted-foreground">CPU: 45%, Memory: 62%</p>
                </div>
                <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities and events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">New user registered</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Book returned</p>
                  <p className="text-xs text-muted-foreground">5 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Status update processed</p>
                  <p className="text-xs text-muted-foreground">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">Item marked overdue</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
