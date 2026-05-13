# Dynamic Dashboard System

This library management system now features a fully dynamic, real-time dashboard that automatically updates based on database changes. Here's how it works and how to use it.

## Features Implemented

### 1. Real-time Dashboard Statistics API
- **Location**: `app/api/dashboard/stats/route.ts`
- **Purpose**: Provides comprehensive dashboard statistics
- **Features**:
  - Patron counts and breakdowns
  - Transaction statistics 
  - Financial information
  - Recent activity feeds
  - Trend data for charts
  - System alerts

### 2. Dynamic Dashboard Hook
- **Location**: `app/hooks/useDashboardStats.ts`
- **Purpose**: React hook for fetching and managing dashboard data
- **Features**:
  - Auto-refresh functionality
  - Connection status monitoring
  - Error handling with retry logic
  - Optimistic updates
  - Visibility change handling (pauses when tab hidden)
  - Online/offline detection

### 3. Interactive Dashboard Components  
- **Location**: `app/components/dashboard/DynamicDashboard.tsx`
- **Purpose**: Rich UI components for displaying dashboard data
- **Features**:
  - Real-time statistics cards with gradient backgrounds
  - Interactive charts using Recharts
  - Configurable sections (can show/hide different parts)
  - Connection status indicators
  - Auto-refresh controls
  - Responsive design

### 4. Server-Sent Events for Live Updates
- **Location**: `app/api/dashboard/stream/route.ts`
- **Purpose**: Push real-time updates to connected clients
- **Features**:
  - Live event streaming
  - Automatic connection management
  - Event broadcasting to multiple clients
  - Manual event triggering
  - Authorization support

### 5. Database Change Tracking
- **Location**: `app/lib/databaseTracker.ts`
- **Purpose**: Monitor database changes and trigger updates
- **Features**:
  - Prisma middleware integration
  - Event-based notifications
  - Sanitized data logging
  - Dashboard stream integration
  - Real-time activity tracking

### 6. Enhanced Patron Management
- **Location**: `app/librarian/patrons/page.tsx`
- **Purpose**: Updated patron management with live statistics
- **Features**:
  - Real-time patron statistics
  - Live connection indicators
  - Enhanced statistics cards with progress bars
  - Auto-refresh functionality
  - Dynamic data updates

## How to Use

### Basic Setup

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Access the dashboard**:
   - Librarian: `http://localhost:3000/librarian/dashboard`
   - Patron Management: `http://localhost:3000/librarian/patrons`

### Dashboard Features

#### Auto-Refresh
- Toggle the "Live Updates" switch to enable/disable real-time updates
- Adjust refresh intervals (10s, 30s, 1m, 5m)
- Manual refresh button available

#### Dashboard Sections
- **Overview Statistics**: Total patrons, active loans, overdue items, utilization rate
- **Patron Distribution**: Breakdown by student/faculty/general with pie charts
- **Financial Overview**: Fines collected, outstanding amounts
- **Activity Trends**: Transaction patterns over time with area charts
- **Recent Activity**: Live feed of transactions and registrations
- **System Alerts**: Important notifications and warnings

#### Customization
- Use the settings panel to show/hide different sections
- Dashboard adapts to user role (librarian/admin)
- Compact mode available for smaller screens

### API Endpoints

#### Dashboard Statistics
```typescript
GET /api/dashboard/stats
```
Returns comprehensive dashboard statistics including:
- Overview metrics
- Patron breakdowns  
- Transaction data
- Financial information
- Recent activities
- Trend data

#### Real-time Stream
```typescript
GET /api/dashboard/stream?role=librarian
```
Establishes SSE connection for live updates. Events include:
- `stats_update`: Regular statistics updates
- `new_patron`: New patron registrations  
- `new_transaction`: Book borrowings/returns
- `overdue_alert`: Overdue book notifications
- `system_alert`: Critical system alerts

#### Manual Event Trigger
```typescript
POST /api/dashboard/stream
{
  "type": "system_alert",
  "message": "Custom alert message",
  "data": { "severity": "high" }
}
```

### Using Dashboard Components in Other Pages

```tsx
import DynamicDashboard from '@/app/components/dashboard/DynamicDashboard';
import { useDashboardStats } from '@/app/hooks/useDashboardStats';

// Full dashboard
<DynamicDashboard 
  userRole="librarian" 
  showControls={true} 
/>

// Using the hook directly
const { stats, loading, error, refetch } = useDashboardStats({
  autoRefresh: true,
  refreshInterval: 30000
});
```

### Database Integration

The system automatically tracks changes to these tables:
- `patron` - User registrations and updates
- `transaction` - Book borrowings and returns  
- `reservation` - Book reservations
- `item` - Book additions and modifications

To use the tracked Prisma client in your API routes:
```typescript
import { trackedPrisma } from '@/app/lib/databaseTracker';

// Use instead of regular Prisma client
const patron = await trackedPrisma.patron.create({
  data: { ... }
});
```

## Technical Architecture

### Data Flow
1. **Database Changes** → Prisma Middleware → Database Tracker
2. **Database Tracker** → Dashboard Stream API → Connected Clients
3. **Dashboard Hook** → Polls Stats API + Receives SSE Events
4. **Dashboard Components** → Display Real-time Data

### Performance Considerations
- Statistics API uses parallel queries for optimal performance
- SSE connections are managed efficiently with automatic cleanup
- Auto-refresh pauses when browser tab is hidden
- Dashboard data is cached and only updated when necessary

### Error Handling
- Graceful fallbacks for network issues
- Automatic retry logic with exponential backoff
- Offline detection and reconnection
- User-friendly error messages

## Customization

### Adding New Metrics
1. Update the statistics API to include new data
2. Add TypeScript interfaces for new metrics
3. Update dashboard components to display new data
4. Add database tracking for new events if needed

### Creating Custom Dashboard Sections
```tsx
// Add to DynamicDashboard component
{visibleSections.customSection && stats && (
  <Card>
    <CardHeader>
      <CardTitle>Custom Section</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Your custom content */}
    </CardContent>
  </Card>
)}
```

### Extending Database Tracking
```typescript
// In databaseTracker.ts
const trackedModels = ['patron', 'transaction', 'reservation', 'item', 'yourNewModel'];
```

## Troubleshooting

### Dashboard Not Updating
- Check browser console for JavaScript errors
- Verify API endpoints are accessible
- Check if auto-refresh is enabled
- Test manual refresh functionality

### SSE Connection Issues
- Check network connectivity
- Verify user role permissions
- Look for firewall or proxy blocking
- Check server-side event logs

### Performance Issues
- Reduce refresh frequency
- Disable unnecessary dashboard sections
- Check database query performance
- Monitor memory usage with dev tools

## Future Enhancements

- WebSocket support for even faster updates
- Push notifications for critical alerts  
- Advanced analytics and reporting
- Dashboard customization persistence
- Mobile-responsive improvements
- Dark mode support

## Dependencies

- Next.js 15.5.0
- Prisma 6.14.0
- React 19.1.0
- Recharts 2.15.4
- Tailwind CSS 3.4.17
- Lucide React 0.462.0

The dynamic dashboard system is now fully integrated and ready to use! All statistics will update automatically every 30 seconds, providing real-time insights into your library operations.
