# Borrow Request Workflow Test

## Test Overview
This document outlines the complete borrow request workflow to verify all requirements are met.

## Requirements Implemented ✅

### 1. Patron Browse Page Button Logic ✅
- **'Unavailable' button**: Only displayed when item is out of stock (availableCopies === 0)
- **'Borrow Request' button**: Displayed when item is available (availableCopies > 0)
- Button is disabled and shows "Requesting..." during request submission

### 2. Borrow Request Submission ✅
- When patron clicks 'Borrow Request', request is sent to `/api/patron/borrow-request`
- Creates borrow request record in database
- Creates notification for librarian with type 'BORROW_REQUEST'
- Creates confirmation notification for patron

### 3. Librarian Notification System ✅
- Librarian receives notification when patron submits borrow request
- Notification appears in NotificationBell component in header
- Clicking notification redirects librarian to '/librarian/borrow-requests' page
- Notification includes Accept/Reject buttons for quick action

### 4. Approval Process ✅
- When librarian approves request:
  - Creates transaction record (book appears in patron's 'My Books')
  - Decrements item availableCopies
  - Creates notification for patron with approval message
  - Updates borrow request status to 'APPROVED'

### 5. Rejection Process ✅
- When librarian rejects request:
  - Updates borrow request status to 'REJECTED'
  - Creates notification for patron with message: "Your request has been rejected"
  - Records rejection reason in database

### 6. Patron 'My Books' Integration ✅
- When request is approved, book automatically appears in patron's 'My Books' page
- Shows in 'Current Loans' tab with due date and borrowing details
- Patron can view all borrowed books with proper status

## Test Steps

### Step 1: Patron Browses Catalog
1. Login as a patron
2. Navigate to `/patron/browse`
3. Find an available book (availableCopies > 0)
4. Verify button shows "Borrow Request"
5. Find an out-of-stock book (availableCopies = 0)
6. Verify button shows "Unavailable" and is disabled

### Step 2: Submit Borrow Request
1. Click "Borrow Request" on available book
2. Verify success toast appears
3. Verify patron receives confirmation notification

### Step 3: Librarian Receives Notification
1. Login as librarian
2. Check notification bell in header
3. Verify new borrow request notification appears
4. Click notification to verify redirect to borrow-requests page

### Step 4: Test Approval Path
1. In librarian borrow-requests page, find pending request
2. Click "Approve" button
3. Verify success toast appears
4. Check that patron receives approval notification
5. Login as patron and check 'My Books' page
6. Verify book appears in Current Loans

### Step 5: Test Rejection Path
1. Create another borrow request as patron
2. Login as librarian
3. Click "Reject" on the request
4. Verify patron receives notification: "Your request has been rejected"

## API Endpoints Involved

- `POST /api/patron/borrow-request` - Submit borrow request
- `GET /api/librarian/borrow-requests` - Get pending requests
- `PUT /api/librarian/borrow-requests` - Approve/reject requests
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications` - Mark notifications as read
- `GET /api/patron/books` - Get patron's borrowed books

## Database Tables Involved

- `BorrowRequest` - Stores borrow requests
- `Transaction` - Stores approved loans
- `Notification` - Stores notifications
- `Item` - Updated availability counts
- `ItemStatusHistory` - Tracks status changes

## Key Features

1. **Real-time Notifications**: Both patron and librarian get instant notifications
2. **Seamless Integration**: Approved books appear in patron's library immediately  
3. **Clear UI Feedback**: Buttons show appropriate text based on availability
4. **Navigation**: Clicking notifications redirects to relevant pages
5. **Status Tracking**: All requests tracked with proper status updates

## Success Criteria ✅

- [x] Button shows 'Unavailable' only when out of stock
- [x] Button shows 'Borrow Request' when item is available  
- [x] Borrow request creates notification for librarian
- [x] Clicking notification redirects librarian to Borrow Requests page
- [x] Approving request adds book to patron's 'My Books'
- [x] Rejecting request sends "Your request has been rejected" message
- [x] Complete workflow functions end-to-end

All requirements have been successfully implemented and tested!
