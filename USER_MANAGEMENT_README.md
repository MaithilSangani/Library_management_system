# User Management System

## Overview

Your admin panel now has a fully functional, dynamic user management system that connects directly to your existing database. The system respects your current database schema and provides a complete CRUD interface for managing all types of users in your library system.

## Features

### ✅ Dynamic Data Loading
- Automatically loads users from your existing database tables
- No mock data - all information comes from your actual database
- Real-time updates when users are created, updated, or deleted

### ✅ Complete CRUD Operations
- **Create**: Add new users (Admin, Librarian, or Patron)
- **Read**: View all users with search and filtering
- **Update**: Edit existing user information
- **Delete**: Remove users (with proper error handling for users with dependencies)

### ✅ Database Integration
- **Admin users**: Stored in `admin` table
- **Librarian users**: Stored in `librarian` table
- **Patron users**: Stored in `patron` table
- Passwords are automatically hashed with bcryptjs
- Original passwords stored for development purposes

### ✅ User Experience
- Loading states during API operations
- Toast notifications for success/error feedback
- Form validation and error handling
- Search and filter functionality
- Responsive design with proper UI components

## API Endpoints

### GET `/api/admin/users`
Fetches all users from all tables and formats them consistently for the UI.

**Response Structure:**
```json
{
  "success": true,
  "users": [
    {
      "id": "admin_1",
      "name": "John Admin",
      "email": "john@admin.com",
      "role": "ADMIN",
      "status": "ACTIVE",
      "createdAt": "2024-01-15",
      "originalId": 1
    }
  ],
  "summary": {
    "totalAdmins": 2,
    "totalLibrarians": 5,
    "totalPatrons": 150,
    "totalUsers": 157
  }
}
```

### POST `/api/admin/users`
Creates a new user in the appropriate table based on the specified role.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "LIBRARIAN",
  "password": "securepassword123"
}
```

### PUT `/api/admin/users`
Updates an existing user's information.

**Request Body:**
```json
{
  "id": "librarian_3",
  "name": "Jane Smith",
  "email": "jane.smith@example.com",
  "role": "LIBRARIAN"
}
```

### DELETE `/api/admin/users?id={userId}`
Deletes a user from the appropriate table.

**Query Parameters:**
- `id`: The user ID (format: "{role}_{originalId}")

## Usage Instructions

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to the user management page:**
   ```
   http://localhost:3000/admin/user-management
   ```

3. **Features you can use:**
   - View all users from your database
   - Search users by name or email
   - Filter users by role (Admin, Librarian, Patron)
   - Add new users with the "Add User" button
   - Edit existing users by clicking the pencil icon
   - Delete users by clicking the trash icon (with confirmation)

## File Structure

```
app/
├── api/admin/users/
│   └── route.ts                    # API endpoints for user management
├── admin/user-management/
│   └── page.tsx                    # User management UI component
└── hooks/
    └── useUserManagement.ts        # Custom hook for API operations
```

## Key Components

### `useUserManagement` Hook
A custom React hook that handles all user management operations:
- Fetching users from the API
- Creating new users
- Updating existing users
- Deleting users
- Managing loading states and error handling

### User Management Page
A comprehensive admin interface that provides:
- User list with search and filtering
- Add user dialog with form validation
- Edit user dialog for updating information
- Delete confirmation and error handling
- Real-time updates after operations

## Database Schema Compatibility

The system works with your existing database schema:

- **admin** table: `adminId`, `adminEmail`, `adminFirstName`, `adminLastName`, `adminPassword`, `adminOriginalPassword`
- **librarian** table: `librarianId`, `librarianEmail`, `librarianFirstName`, `librarianLastName`, `librarianPassword`, `librarianOriginalPassword`
- **patron** table: `patronId`, `patronEmail`, `patronFirstName`, `patronLastName`, `patronPassword`, `patronOriginalPassword`, `isStudent`, `isFaculty`, `patronCreatedAt`

## Security Features

- Passwords are hashed using bcryptjs before storage
- Input validation on both frontend and backend
- Email uniqueness validation across all user types
- Error handling for database constraint violations
- Protection against user deletion when they have associated records

## Error Handling

The system includes comprehensive error handling:
- Network errors are caught and displayed to users
- Database constraint violations are handled gracefully
- Loading states prevent multiple simultaneous operations
- User-friendly error messages via toast notifications

## Important Notes

⚠️ **Database Permissions**: Make sure your `DATABASE_URL` is configured correctly in your `.env` file.

⚠️ **User Dependencies**: When deleting users, the system will fail gracefully if the user has associated records (transactions, reservations, etc.) due to foreign key constraints.

⚠️ **Development vs Production**: Original passwords are stored in the database for development purposes. Consider removing this feature in production.

## Troubleshooting

### Common Issues

1. **"Failed to fetch users" error**
   - Check your database connection
   - Verify your `DATABASE_URL` in `.env`
   - Ensure Prisma client is properly configured

2. **"Email already exists" when creating users**
   - The system enforces email uniqueness across all user types
   - Use a different email address

3. **User deletion fails**
   - The user likely has associated records in other tables
   - Review database relationships before deletion

4. **Build/compilation errors**
   - Clear the `.next` directory and restart the dev server
   - Check for any TypeScript errors in the console

## Support

If you encounter any issues with the user management system, check the console for detailed error messages and ensure your database connection is properly configured.

The system is designed to be robust and user-friendly while respecting your existing database structure and relationships.
