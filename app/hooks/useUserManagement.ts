import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'LIBRARIAN' | 'PATRON';
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  originalId?: number;
  isStudent?: boolean;
  isFaculty?: boolean;
}

interface CreateUserData {
  name: string;
  email: string;
  role: 'ADMIN' | 'LIBRARIAN' | 'PATRON';
  password: string;
}

interface UpdateUserData {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'LIBRARIAN' | 'PATRON';
}

interface UserManagementState {
  users: User[];
  loading: boolean;
  error: string | null;
  summary?: {
    totalAdmins: number;
    totalLibrarians: number;
    totalPatrons: number;
    totalUsers: number;
  };
}

export function useUserManagement() {
  const [state, setState] = useState<UserManagementState>({
    users: [],
    loading: true,
    error: null,
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          users: data.users,
          summary: data.summary,
          loading: false,
        }));
      } else {
        throw new Error(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      toast.error(errorMessage);
    }
  };

  // Create a new user
  const createUser = async (userData: CreateUserData): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'User created successfully');
        await fetchUsers(); // Refresh the user list
        return true;
      } else {
        throw new Error(data.error || 'Failed to create user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      toast.error(errorMessage);
      return false;
    }
  };

  // Update an existing user
  const updateUser = async (userData: UpdateUserData): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'User updated successfully');
        await fetchUsers(); // Refresh the user list
        return true;
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      toast.error(errorMessage);
      return false;
    }
  };

  // Delete a user
  const deleteUser = async (userId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users?id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || 'User deleted successfully');
        await fetchUsers(); // Refresh the user list
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      toast.error(errorMessage);
      return false;
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    ...state,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}

export type { User, CreateUserData, UpdateUserData };
