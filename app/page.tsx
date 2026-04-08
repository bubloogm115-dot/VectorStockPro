'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Download, TrendingUp, Clock, Star, Loader2, User, LogOut } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function HomePage() {
  const [vectors, setVectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'recent' | 'popular' | 'trending'>('recent');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pageLimit, setPageLimit] = useState(20);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  // Fetch vectors based on filter, search, and pagination
  useEffect(() => {
    let q;
    
    if (activeSearch) {
      // Fetch a larger pool of recent vectors to filter client-side for better partial matching
      q = query(collection(db, 'vectors'), orderBy('createdAt', 'desc'), limit(200));
    } else if (filter === 'recent') {
      q = query(collection(db, 'vectors'), orderBy('createdAt', 'desc'), limit(pageLimit));
    } else if (filter === 'popular') {
      q = query(collection(db, 'vectors'), orderBy('downloads', 'desc'), limit(pageLimit));
    } else if (filter === 'trending') {
      // For trending, we'll just sort by downloads but maybe limit to top 8
      q = query(collection(db, 'vectors'), orderBy('downloads', 'desc'), limit(8));
    } else {
      q = query(collection(db, 'vectors'), orderBy('createdAt', 'desc'), limit(pageLimit));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let vectorData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      if (activeSearch) {
        const searchTerms = activeSearch.split(/\s+/).filter(w => w);
        // Filter vectors where ALL search terms match somewhere in title, category, or keywords
        vectorData = vectorData.filter(v => {
          const searchString = `${v.title || ''} ${v.category || ''} ${(v.keywords || []).join(' ')}`.toLowerCase();
          return searchTerms.every(term => searchString.includes(term));
        });
        
        setHasMore(vectorData.length > pageLimit);
        vectorData = vectorData.slice(0, pageLimit);
      } else {
        if (filter !== 'trending') {
          setHasMore(snapshot.docs.length === pageLimit);
        } else {
          setHasMore(false);
        }
      }
      
      setVectors(vectorData);
      setLoading(false);
      setLoadingMore(false);
    });
    return () => unsubscribe();
  }, [filter, pageLimit, activeSearch]);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setActiveSearch(searchInput.trim().toLowerCase());
    setPageLimit(20);
    setLoading(true);
  };

  const loadMore = () => {
    setLoadingMore(true);
    setPageLimit(prev => prev + 20);
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center gap-2">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg">VS</span>
              <span className="hidden sm:inline">VectorStock Pro</span>
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            {currentUser ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex items-center gap-1 sm:gap-2 text-gray-700 font-medium bg-gray-100 px-2 sm:px-3 py-1.5 rounded-full">
                  <User className="w-4 h-4" />
                  <span className="text-xs sm:text-sm max-w-[80px] sm:max-w-[100px] truncate">{currentUser.displayName || 'User'}</span>
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <>
                <Link href="/login" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 font-medium transition-colors">
                  Login
                </Link>
                <Link href="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-colors">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Search */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-12 sm:py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Download High-Quality Vectors & Illustrations
          </h1>
          <p className="text-base sm:text-lg text-gray-600 mb-8 sm:mb-10">
            Free vectors, photos, and PSD downloads for your next creative project.
          </p>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-3xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="block w-full pl-10 sm:pl-12 pr-24 py-3 sm:py-4 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 text-base sm:text-lg shadow-sm transition-colors outline-none"
              placeholder="Search vectors by keywords..."
            />
            <button type="submit" className="absolute inset-y-1.5 sm:inset-y-2 right-1.5 sm:right-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 rounded-lg text-sm sm:text-base font-medium transition-colors">
              Search
            </button>
          </form>
        </div>
      </section>

      {/* Ad Placeholder 1 (Header Ad) */}
      <div className="max-w-7xl mx-auto w-full px-4 py-6">
        <div className="bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg h-24 flex items-center justify-center text-gray-500">
          AdSense Placeholder (728x90)
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        {activeSearch ? (
          <div className="flex items-center justify-between mb-8 pb-2 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">
              Search results for "{activeSearch}"
            </h2>
            <button 
              onClick={() => {
                setActiveSearch('');
                setSearchInput('');
                setPageLimit(20);
                setLoading(true);
              }}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 mb-8 overflow-x-auto pb-2">
            <button 
              onClick={() => { setFilter('trending'); setPageLimit(20); setHasMore(true); setLoading(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium border transition-colors ${
                filter === 'trending' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <TrendingUp className="w-4 h-4" /> Trending
            </button>
            <button 
              onClick={() => { setFilter('recent'); setPageLimit(20); setHasMore(true); setLoading(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium border transition-colors ${
                filter === 'recent' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Clock className="w-4 h-4" /> Recent
            </button>
            <button 
              onClick={() => { setFilter('popular'); setPageLimit(20); setHasMore(true); setLoading(true); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium border transition-colors ${
                filter === 'popular' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
              }`}
            >
              <Star className="w-4 h-4" /> Popular
            </button>
          </div>
        )}

        {/* Vectors Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : vectors.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-lg">No vectors found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {vectors.map((vector) => (
              <Link href={`/vector/${vector.id}`} key={vector.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 block">
                {/* Image Placeholder */}
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  <Image 
                    src={vector.jpgUrl || vector.url || 'https://i.ibb.co/placeholder.png'} 
                    alt={vector.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{vector.title}</h3>
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-gray-500">{vector.category}</p>
                    <p className="text-xs font-medium text-blue-600 capitalize">
                      {vector.fileType === 'image' ? 'Free Image' : 'Free Vector'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMore && !loading && (
          <div className="flex justify-center mt-10">
            <button 
              onClick={loadMore}
              disabled={loadingMore}
              className="bg-white border-2 border-gray-200 text-gray-700 hover:border-blue-500 hover:text-blue-600 px-8 py-3 rounded-xl font-medium transition-all flex items-center gap-2"
            >
              {loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Load More Vectors'}
            </button>
          </div>
        )}

        {/* Ad Placeholder 2 (In-feed Ad) */}
        <div className="my-12 bg-gray-200 border-2 border-dashed border-gray-300 rounded-lg h-32 flex items-center justify-center text-gray-500">
          AdSense Placeholder (In-feed / Responsive)
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white p-1 rounded-md text-xs">VS</span>
                VectorStock Pro
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                High-quality free vectors and illustrations for your creative projects. Download up to 5 free vectors daily.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Pages</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/about" className="hover:text-blue-600 transition-colors">About Us</Link></li>
                <li><Link href="/blog" className="hover:text-blue-600 transition-colors">Blog</Link></li>
                <li><Link href="/faq" className="hover:text-blue-600 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/terms" className="hover:text-blue-600 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-blue-600 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><Link href="/contact" className="hover:text-blue-600 transition-colors">Contact Us</Link></li>
                <li><Link href="/admin/login" className="hover:text-blue-600 transition-colors">Admin Panel</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between text-gray-500 text-sm">
            <div>&copy; {new Date().getFullYear()} VectorStock Pro. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

