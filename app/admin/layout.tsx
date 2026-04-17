'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Link from 'next/link';
import { LayoutDashboard, Upload, Users, FileText, MessageSquare, LogOut, Loader2, Image as ImageIcon } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAuthenticated(true);
        // Agar user already logged in hai aur login page par hai, toh dashboard par bhej dein
        if (isLoginPage) {
          router.push('/admin');
        }
      } else {
        setIsAuthenticated(false);
        // Agar user logged in nahi hai aur kisi aur page par hai, toh login par bhej dein
        if (!isLoginPage) {
          router.push('/admin/login');
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [router, isLoginPage]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  // Agar login page hai, toh sirf login form dikhayein (sidebar nahi)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Agar login nahi hai aur login page par bhi nahi hai, toh kuch na dikhayein (redirect ho jayega)
  if (!isAuthenticated) {
    return null;
  }

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Manage Images', href: '/admin/vectors', icon: ImageIcon },
    { name: 'Upload Vector', href: '/admin/upload', icon: Upload },
    { name: 'Bulk Metadata', href: '/admin/bulk-metadata', icon: FileText },
    { name: 'Manage Users', href: '/admin/users', icon: Users },
    { name: 'Blog Posts', href: '/admin/blog', icon: FileText },
    { name: 'Feedback', href: '/admin/feedback', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-1">VectorStock Pro</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
