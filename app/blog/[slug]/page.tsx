'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Loader2, ArrowLeft, Clock, Calendar } from 'lucide-react';
import Markdown from 'react-markdown';

export default function SingleBlogPage() {
  const { slug } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        if (!slug || typeof slug !== 'string') return;
        
        let foundPost = null;

        // Try querying by slug first
        const q = query(collection(db, 'blog'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          foundPost = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
        } else {
          // Fallback: try finding by doc ID (for older posts that may lack a slug)
          const docRef = doc(db, 'blog', slug);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            foundPost = { id: docSnap.id, ...docSnap.data() };
          }
        }

        if (foundPost) {
          setPost(foundPost);
        } else {
          router.replace('/404');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Post Not Found</h1>
        <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist or has been removed.</p>
        <Link href="/blog" className="text-blue-600 font-medium hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">VS</span>
            <span className="hidden sm:inline">VectorStock Pro</span>
          </Link>
          <div className="flex gap-4">
            <Link href="/blog" className="text-sm sm:text-base text-gray-600 hover:text-blue-600 font-medium">All Posts</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 lg:py-16">
        <Link href="/blog" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-8 font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        {/* Article Header */}
        <header className="mb-8 lg:mb-12 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6 tracking-tight">
            {post.title}
          </h1>
          <div className="flex items-center justify-center gap-6 text-gray-500 text-sm font-medium">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>{post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{Math.max(1, Math.ceil((post.content?.length || 0) / 1000))} min read</span>
            </div>
          </div>
        </header>

        {/* Featured Image */}
        {post.imageUrl && (
          <div className="mb-12 rounded-3xl overflow-hidden shadow-xl border border-gray-100 bg-white group cursor-pointer" onClick={() => window.open(post.imageUrl, '_blank')}>
            <div className="aspect-[21/9] sm:aspect-[16/9] relative overflow-hidden">
              <Image 
                src={post.imageUrl} 
                alt={post.title} 
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        {/* AdSense Top Placeholder */}
        <div className="mb-12 bg-gray-100/80 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[120px]">
          <span className="text-gray-400 font-mono text-sm tracking-widest uppercase mb-1">Advertisement</span>
          <p className="text-gray-500 font-medium">AdSense Placeholder (Top)</p>
          <p className="text-gray-400 text-xs mt-2">Replace me with &lt;AdSense /&gt; component</p>
        </div>

        {/* Article Body */}
        <article className="prose prose-lg md:prose-xl prose-blue max-w-none text-gray-700 leading-relaxed space-y-6">
          <div className="markdown-body">
            <Markdown>{post.content}</Markdown>
          </div>
        </article>

        {/* AdSense Bottom Placeholder */}
        <div className="mt-16 bg-gray-100/80 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center min-h-[250px]">
          <span className="text-gray-400 font-mono text-sm tracking-widest uppercase mb-1">Advertisement</span>
          <p className="text-gray-500 font-medium text-lg">AdSense Placeholder (Bottom)</p>
          <p className="text-gray-400 text-sm mt-2">Responsive Ad Unit</p>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-500 font-medium tracking-wide">
            © {new Date().getFullYear()} VectorStock Pro. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
