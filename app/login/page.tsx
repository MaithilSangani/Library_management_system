'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BookOpen, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Login() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const router = useRouter();
  const { login, isLoading } = useAuth();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    try {
      const success = await login(email, password);
      
      if (success) {
        setSuccess(`Welcome! Redirecting to your dashboard...`);
        
        // Get user role to determine redirect path
        const storedUser = localStorage.getItem('auth-user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          
          // Redirect to role-specific dashboard
          setTimeout(() => {
            if (user.role === 'ADMIN') {
              router.push('/admin/dashboard');
            } else if (user.role === 'LIBRARIAN') {
              router.push('/librarian/dashboard');
            } else if (user.role === 'PATRON') {
              router.push('/patron/dashboard');
            } else {
              router.push('/'); // fallback to home
            }
          }, 1500);
        }
      } else {
        setError("Invalid email or password. Please try again.");
      }
    } catch (error) {
      console.error('Login error:', error);
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero font-inter flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Hero Section */}
        <div className="text-center lg:text-left text-white space-y-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-8">
            <BookOpen className="w-8 h-8" />
            <h1 className="font-serif text-3xl font-bold">BookVault</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="font-serif text-4xl lg:text-5xl font-bold leading-tight">
              Welcome Back
            </h2>
            <p className="text-lg opacity-90 max-w-lg">
              Sign in to your account to continue managing your library with intelligence and ease.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm opacity-90">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Secure login with role-based access</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span>Access all your library features</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-elegant border-0 bg-card/95 backdrop-blur">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="Enter your email address"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="Enter your password"
                    required 
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-white hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
              
              <div className="mt-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{" "}
                    <Link 
                      href="/signup" 
                      className="font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Create one here
                    </Link>
                  </p>
                </div>
                
                {/* Test Credentials */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Database Test Credentials:</h4>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium text-blue-600">Admin:</span>
                        <div>admin@library.com</div>
                        <div>admin123</div>
                      </div>
                      <div>
                        <span className="font-medium text-green-600">Librarian:</span>
                        <div>librarian@library.com</div>
                        <div>librarian123</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-center mt-2">
                      <div>
                        <span className="font-medium text-orange-600">Patron:</span>
                        <div>user@library.com</div>
                        <div>user123</div>
                      </div>
                      <div>
                        <span className="font-medium text-purple-600">Student:</span>
                        <div>student@library.com</div>
                        <div>student123</div>
                      </div>
                      <div>
                        <span className="font-medium text-indigo-600">Faculty:</span>
                        <div>faculty@library.com</div>
                        <div>faculty123</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
