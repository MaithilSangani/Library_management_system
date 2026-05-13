# System Configuration Management

## Overview

Your admin panel now has a comprehensive system configuration page that dynamically connects to your existing database. The system uses the `librarysettings` table to manage library-wide settings and provides real-time system statistics from your actual database data.

## Features

### ✅ Dynamic Library Settings Management
- **Borrowing Limit**: Configure maximum books a user can borrow simultaneously (1-50)
- **Loan Period**: Set default loan duration in days (1-365)
- **Fine Per Day**: Define fine amount for overdue books ($0-$1000)
- Real-time validation with proper range checking
- Audit trail showing who made changes and when

### ✅ System Statistics Dashboard
- **Total Users**: Count across admin, librarian, and patron tables
- **Total Items**: Books and resources in the library
- **Total Transactions**: All borrow/return activities
- **Overdue Items**: Books past their due date (with status indicators)
- **Pending Requests**: Borrow requests awaiting approval
- **Fines Collected**: Total fine payments received
- Auto-refresh every 5 minutes with manual refresh option

### ✅ Advanced User Experience
- Form validation with instant feedback
- Loading states during operations
- Change tracking (unsaved changes indicator)
- Reset to defaults functionality
- Comprehensive error handling
- Toast notifications for all operations
- Responsive design optimized for all screen sizes

## Database Integration

The system works seamlessly with your existing `librarysettings` table:

```sql
-- Table structure (from your existing schema)
CREATE TABLE librarysettings (
  librarySettingsId INT PRIMARY KEY DEFAULT 1,
  borrowingLimit INT DEFAULT 5,
  loanPeriodDays INT DEFAULT 14,
  finePerDay FLOAT DEFAULT 1,
  updatedAt DATETIME,
  updatedByAdminId INT,
  FOREIGN KEY (updatedByAdminId) REFERENCES admin(adminId)
);
```

## API Endpoints

### GET `/api/admin/system-config`
Retrieves current library settings and configuration information.

**Response Structure:**
```json
{
  "success": true,
  "settings": {
    "librarySettingsId": 1,
    "borrowingLimit": 5,
    "loanPeriodDays": 14,
    "finePerDay": 1.0,
    "updatedAt": "2024-01-15T10:30:00Z",
    "updatedByAdminId": 1,
    "updatedBy": {
      "id": 1,
      "name": "John Admin",
      "email": "john@admin.com"
    }
  }
}
```

### PUT `/api/admin/system-config`
Updates library settings with validation.

**Request Body:**
```json
{
  "borrowingLimit": 10,
  "loanPeriodDays": 21,
  "finePerDay": 1.5,
  "updatedByAdminId": 1
}
```

**Validation Rules:**
- `borrowingLimit`: Integer between 1-50
- `loanPeriodDays`: Integer between 1-365 days
- `finePerDay`: Number between $0-$1000

### POST `/api/admin/system-config`
Fetches comprehensive system statistics.

**Request Body:**
```json
{
  "action": "getSystemStats"
}
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 157,
    "totalItems": 2543,
    "totalTransactions": 8932,
    "overdueTransactions": 12,
    "pendingRequests": 5,
    "totalFinesCollected": 245.50
  }
}
```

## File Structure

```
app/
├── api/admin/system-config/
│   └── route.ts                    # API endpoints for system config
├── admin/system-config/
│   └── page.tsx                    # System configuration UI
└── hooks/
    └── useSystemConfig.ts          # Custom hook for config operations
```

## Key Components

### `useSystemConfig` Hook
A comprehensive React hook that manages:
- Library settings fetching and updating
- System statistics retrieval
- Form validation
- Currency and date formatting
- Auto-refresh functionality
- Error handling and loading states

**Key Functions:**
- `fetchSettings()` - Load current configuration
- `fetchSystemStats()` - Get real-time statistics
- `updateSettings(data)` - Save configuration changes
- `resetToDefaults()` - Restore default settings
- `validateSettings(data)` - Client-side validation
- `formatCurrency(amount)` - Currency formatting
- `getTimeAgo(date)` - Relative time display

### System Configuration Page
A comprehensive admin interface featuring:

**Statistics Dashboard:**
- 6 key metric cards with visual indicators
- Color-coded status badges for overdue/pending items
- Loading states and refresh functionality
- Responsive grid layout

**Settings Management:**
- Three main configuration fields
- Real-time validation feedback
- Change tracking with visual indicators
- Save/Reset functionality with confirmation
- Loading states during operations

**Configuration Audit:**
- Current active settings display
- Last updated timestamp and admin info
- Relative time formatting ("2 hours ago")
- Admin details with email

## Usage Instructions

1. **Navigate to the System Configuration page:**
   ```
   http://localhost:3000/admin/system-config
   ```

2. **View System Statistics:**
   - Statistics are automatically loaded and refresh every 5 minutes
   - Use the "Refresh Stats" button for manual updates
   - Color-coded badges indicate system health

3. **Modify Library Settings:**
   - Change any of the three main settings
   - Orange indicator shows unsaved changes
   - Validation happens in real-time
   - Click "Save Settings" to persist changes

4. **Reset to Defaults:**
   - Click "Reset to Defaults" button
   - Confirm the action (irreversible)
   - Settings revert to: 5 books, 14 days, $1.00/day

## Configuration Options

### Borrowing Limit (1-50 books)
Controls the maximum number of books a patron can borrow simultaneously.
- **Low (1-3)**: Restrictive, suitable for limited inventory
- **Medium (4-10)**: Balanced approach for most libraries
- **High (11-50)**: Liberal policy for extensive collections

### Loan Period (1-365 days)
Sets the default checkout duration for borrowed books.
- **Short (1-7 days)**: High-demand or reference materials
- **Standard (14-21 days)**: Most common library setting
- **Extended (30+ days)**: Academic or research materials

### Fine Per Day ($0-$1000)
Late fee charged for each day a book is overdue.
- **Free ($0)**: No-fine policy
- **Low ($0.25-$0.50)**: Gentle encouragement
- **Standard ($1-$2)**: Common library rates
- **High ($3+)**: Strong deterrent for expensive materials

## System Statistics Explained

### Total Users
Sum of all users across admin, librarian, and patron tables.

### Total Items
Count of all books and resources in your library catalog.

### Total Transactions
All borrowing transactions, both active and completed.

### Overdue Items
Books currently checked out past their due date.
- **Status**: Green (0 overdue) = Good, Red (>0) = Action Needed

### Pending Requests
Borrow requests waiting for librarian approval.
- **Status**: Blue (≤10) = Normal, Yellow (>10) = High Volume

### Fines Collected
Total amount collected from fine payments marked as "PAID".

## Security Features

- Input validation on both client and server sides
- Range checking for all numeric inputs
- Admin ID validation for audit trail
- Proper error handling for database constraints
- Secure database queries with Prisma ORM

## Error Handling

The system includes comprehensive error handling:

### Client-Side Validation
- Range checking before submission
- Real-time feedback on invalid inputs
- User-friendly error messages

### Server-Side Validation
- Data type verification
- Range boundary checking
- Admin ID existence validation
- Database constraint handling

### User Feedback
- Toast notifications for all operations
- Loading states to prevent double-submission
- Clear error messages with actionable guidance

## Important Notes

⚠️ **Database Integrity**: The system uses the existing `librarysettings` table without modifications.

⚠️ **Single Configuration**: Only one configuration record exists (ID = 1) as per your schema design.

⚠️ **Admin Tracking**: Changes are tracked by admin ID for audit purposes. Currently hardcoded to admin ID 1 (TODO: integrate with auth system).

⚠️ **Auto-Refresh**: Statistics refresh automatically every 5 minutes to provide current data.

## Troubleshooting

### Common Issues

1. **"Failed to fetch settings" error**
   - Check database connection
   - Verify `librarysettings` table exists
   - Ensure proper Prisma client configuration

2. **Settings not saving**
   - Verify input values are within valid ranges
   - Check admin ID exists in database
   - Review server console for detailed errors

3. **Statistics not loading**
   - Check database permissions
   - Verify all referenced tables exist
   - Review network connectivity

4. **Validation errors**
   - Ensure values are within specified ranges
   - Check for proper numeric input
   - Verify no empty fields

## Default Configuration

When no settings exist in the database, the system uses these defaults:
- **Borrowing Limit**: 5 books
- **Loan Period**: 14 days  
- **Fine Per Day**: $1.00

## Future Enhancements

Possible future additions to the system:
- Email notification settings
- Library hours configuration
- Reservation policies
- Category-specific loan periods
- Multi-location support
- Advanced reporting configuration

## Support

The system is designed to be robust and user-friendly while maintaining complete compatibility with your existing database structure. All configuration changes are immediately applied system-wide and affect all future transactions.
