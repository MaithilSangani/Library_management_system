'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { BookOpen, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/app/components/ui/alert";

export default function Signup() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [userType, setUserType] = useState<string>("PATRON");
  const [accountType, setAccountType] = useState<string>("general");
  const [studentDetails, setStudentDetails] = useState({
    department: '',
    semester: 1,
    rollNo: '',
    enrollmentNumber: ''
  });
  const [facultyDetails, setFacultyDetails] = useState({
    department: ''
  });
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    
    if (!firstName || !lastName || !email || !password) {
      setError("Please fill in all fields.");
      setIsLoading(false);
      return;
    }

    // Additional validation for patron accounts
    if (userType === 'PATRON') {
      if (accountType === 'student' && !studentDetails.department) {
        setError("Department is required for student accounts.");
        setIsLoading(false);
        return;
      }
      if (accountType === 'faculty' && !facultyDetails.department) {
        setError("Department is required for faculty accounts.");
        setIsLoading(false);
        return;
      }
    }
    
    try {
      const requestBody: any = {
        firstName,
        lastName,
        email,
        password,
        userType,
      };

      // Add patron-specific fields
      if (userType === 'PATRON') {
        requestBody.accountType = accountType;
        if (accountType === 'student') {
          requestBody.studentDetails = {
            department: studentDetails.department,
            semester: parseInt(studentDetails.semester.toString()) || null,
            rollNo: studentDetails.rollNo ? parseInt(studentDetails.rollNo) : null,
            enrollmentNumber: studentDetails.enrollmentNumber ? parseInt(studentDetails.enrollmentNumber) : null,
          };
        } else if (accountType === 'faculty') {
          requestBody.facultyDetails = {
            department: facultyDetails.department,
          };
        }
      }

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Account created successfully! Redirecting to login...");
        setTimeout(() => router.push("/login"), 2000);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError("Network error. Please check your connection and try again.");
    }
    
    setIsLoading(false);
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
              Get Started Today
            </h2>
            <p className="text-lg opacity-90 max-w-lg">
              Create your account and start managing your library with our intelligent book management system.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <div className="flex items-center gap-3 text-sm opacity-90">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Free to get started - No credit card required</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Role-based access control for team management</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span>Advanced analytics and reporting features</span>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="w-full max-w-lg mx-auto">
          <Card className="shadow-elegant border-0 bg-card/95 backdrop-blur max-h-[85vh] overflow-y-auto">
            <CardHeader className="text-center space-y-2">
              <CardTitle className="text-2xl font-semibold">Create Account</CardTitle>
              <CardDescription>
                Join thousands of users managing their libraries efficiently
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      type="text" 
                      placeholder="Enter first name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      type="text" 
                      placeholder="Enter last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userType">Primary Account Type</Label>
                  <select 
                    id="userType" 
                    name="userType"
                    className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                    value={userType}
                    onChange={(e) => setUserType(e.target.value)}
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="PATRON">Patron</option>
                  </select>
                </div>

                {/* Patron Account Type Selection */}
                {userType === 'PATRON' && (
                  <div className="space-y-2">
                    <Label htmlFor="accountType">Patron Type</Label>
                    <select 
                      id="accountType" 
                      name="accountType"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value)}
                    >
                      <option value="general">General Patron</option>
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                    </select>
                  </div>
                )}

                {/* Student Details */}
                {userType === 'PATRON' && accountType === 'student' && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-medium text-blue-700">Student Details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="studentDepartment">Department *</Label>
                      <Input 
                        id="studentDepartment" 
                        type="text" 
                        placeholder="e.g., Computer Science"
                        value={studentDetails.department}
                        onChange={(e) => setStudentDetails({...studentDetails, department: e.target.value})}
                        required 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="semester">Semester</Label>
                        <select 
                          id="semester"
                          className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                          value={studentDetails.semester}
                          onChange={(e) => setStudentDetails({...studentDetails, semester: parseInt(e.target.value)})}
                        >
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="rollNo">Roll Number</Label>
                        <Input 
                          id="rollNo" 
                          type="number" 
                          placeholder="e.g., 101"
                          value={studentDetails.rollNo}
                          onChange={(e) => setStudentDetails({...studentDetails, rollNo: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="enrollmentNumber">Enrollment Number</Label>
                      <Input 
                        id="enrollmentNumber" 
                        type="number" 
                        placeholder="e.g., 2024001"
                        value={studentDetails.enrollmentNumber}
                        onChange={(e) => setStudentDetails({...studentDetails, enrollmentNumber: e.target.value})}
                      />
                    </div>
                  </div>
                )}

                {/* Faculty Details */}
                {userType === 'PATRON' && accountType === 'faculty' && (
                  <div className="space-y-4 border-t pt-4">
                    <Label className="text-base font-medium text-indigo-700">Faculty Details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="facultyDepartment">Department *</Label>
                      <Input 
                        id="facultyDepartment" 
                        type="text" 
                        placeholder="e.g., Computer Science"
                        value={facultyDetails.department}
                        onChange={(e) => setFacultyDetails({...facultyDetails, department: e.target.value})}
                        required 
                      />
                    </div>
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-primary text-white hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link 
                    href="/login" 
                    className="font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
              
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  <strong>Note:</strong> New accounts are created with 'User' role by default.
                  Contact your administrator for role upgrades.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
