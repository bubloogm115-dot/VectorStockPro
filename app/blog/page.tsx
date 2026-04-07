'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { FileText, Loader2 } from 'lucide-react';

export default function BlogPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'blog'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">VS</span>
            <span className="hidden sm:inline">VectorStock Pro</span>
          </Link>
          <Link href="/" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 font-medium">Back to Home</Link>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="text-center mb-12">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Blog</h1>
          <p className="text-gray-600 text-lg">Latest news, design tips, and updates from VectorStock Pro.</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100">
            <p className="text-lg">No blog posts found. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className="aspect-[16/9] bg-gray-100 relative overflow-hidden">
                  <Image 
                    src={post.imageUrl} 
                    alt={post.title} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <span className="text-xs font-medium text-blue-600 mb-2">
                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{post.title}</h2>
                  <p className="text-gray-600 line-clamp-3 mb-4 flex-1">{post.content}</p>
                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <button className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                      Read More →
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
