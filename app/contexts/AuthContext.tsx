import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// User types and roles
export type UserRole = 'ADMIN' | 'LIBRARIAN' | 'PATRON';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  patronId?: number;
  adminId?: number;
  librarianId?: number;
  // Role-specific email properties for API calls
  patronEmail?: string;
  adminEmail?: string;
  librarianEmail?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('auth-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('auth-user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Transform database user to our User interface
        const dbUser = data.user;
        const userRole: UserRole = data.userType as UserRole;
        
        // Get name from different user types
        let userName = 'User';
        if (userRole === 'ADMIN' && dbUser.adminFirstName) {
          userName = `${dbUser.adminFirstName} ${dbUser.adminLastName}`;
        } else if (userRole === 'LIBRARIAN' && dbUser.librarianFirstName) {
          userName = `${dbUser.librarianFirstName} ${dbUser.librarianLastName}`;
        } else if (userRole === 'PATRON' && dbUser.patronFirstName) {
          userName = `${dbUser.patronFirstName} ${dbUser.patronLastName}`;
        }
        
        const transformedUser: User = {
          id: userRole === 'ADMIN' ? dbUser.adminId?.toString() || '1' :
              userRole === 'LIBRARIAN' ? dbUser.librarianId?.toString() || '2' :
              dbUser.patronId?.toString() || '3',
          name: userName,
          email: email,
          role: userRole,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${userRole === 'ADMIN' ? '1e3a8a' : userRole === 'LIBRARIAN' ? '059669' : '7c2d12'}&color=ffffff`,
          patronId: userRole === 'PATRON' ? dbUser.patronId : undefined,
          adminId: userRole === 'ADMIN' ? dbUser.adminId : undefined,
          librarianId: userRole === 'LIBRARIAN' ? dbUser.librarianId : undefined,
          // Add role-specific email properties for API calls
          patronEmail: userRole === 'PATRON' ? email : undefined,
          adminEmail: userRole === 'ADMIN' ? email : undefined,
          librarianEmail: userRole === 'LIBRARIAN' ? email : undefined
        };

        setUser(transformedUser);
        localStorage.setItem('auth-user', JSON.stringify(transformedUser));
        localStorage.setItem('auth-token', data.token);
        
        setIsLoading(false);
        return true;
      } else {
        setIsLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // For now, signup creates a PATRON by default
      // In a real app, you'd have a separate API endpoint for signup
      const [firstName, lastName = ''] = name.split(' ');
      
      // This is a placeholder - you'd need to implement a real signup API endpoint
      console.log('Signup functionality not implemented with database yet');
      
      setIsLoading(false);
      return false; // Return false for now since we haven't implemented database signup
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = () => {
    // Clear client-side state immediately
    setUser(null);
    localStorage.removeItem('auth-user');
    localStorage.removeItem('auth-token');
    
    // Make async logout API call in background (non-blocking)
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(error => {
      console.error('Logout API error:', error);
    });
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(user.role);
  };

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    hasRole
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
