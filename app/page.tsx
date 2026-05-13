'use client'

import { useEffect } from 'react';
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { BookOpen, Users, Lock, BarChart3, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from './contexts/AuthContext';

export default function Landing() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      // Redirect based on user role
      switch (user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'LIBRARIAN':
          router.push('/librarian/dashboard');
          break;
        case 'PATRON':
          router.push('/patron/dashboard');
          break;
        default:
          router.push('/login');
      }
    }
  }, [user, router]);

  // Show landing page only if user is not authenticated
  if (user) {
    return null; // Will redirect via useEffect
  }

  const features = [
    {
      icon: BookOpen,
      title: "Smart Book Management",
      description: "Efficiently catalog and organize your entire library collection with intelligent search and categorization."
    },
    {
      icon: Users,
      title: "User Management",
      description: "Role-based access control with admin, librarian, and user permissions for secure operations."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive insights into library usage, popular books, and user engagement metrics."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with data protection and backup systems for peace of mind."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-hero font-inter">
      {/* Header */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <h1 className="font-serif text-2xl font-bold text-white">BookVault</h1>
            </div>
            <Button 
              variant="ghost" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-6 py-2"
              onClick={() => router.push('/login')}
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-16 lg:py-24">
          <div className="max-w-4xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-sm mb-8">
              <Zap className="w-4 h-4" />
              <span>Smart Library Management System</span>
            </div>
            
            <h1 className="font-serif text-4xl lg:text-6xl font-bold leading-tight mb-6">
              Manage Your Library with 
              <span className="block bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                Intelligence
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl opacity-90 mb-12 max-w-3xl mx-auto leading-relaxed">
              A comprehensive book management system designed for libraries, bookstores, and personal collections. 
              Track inventory, manage users, and discover powerful insights.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                size="lg"
                className="bg-white text-white hover:bg-white/90 font-semibold px-8 py-3 text-lg bg-gradient-primary hover:opacity-90"
                onClick={() => router.push('/signup')}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Get Started Free
              </Button>
              
              <Button
                size="lg"
                className="bg-gradient-primary text-white hover:opacity-90 font-semibold px-8 py-3 text-lg"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </div>

            {/* Features Preview */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="bg-white/10 backdrop-blur border-white/20 shadow-elegant">
                  <CardContent className="p-6 text-center">
                    <feature.icon className="w-8 h-8 text-white mx-auto mb-4" />
                    <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                    <p className="text-sm text-white/80 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center text-white">
            <div className="flex items-center justify-center gap-6 text-sm opacity-80">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Multi-user access</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Secure authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span>Advanced analytics</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
