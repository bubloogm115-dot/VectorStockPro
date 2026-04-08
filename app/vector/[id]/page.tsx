'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, updateDoc, increment, collection, query, where, limit, getDocs, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Download, Loader2, ArrowLeft, Image as ImageIcon, FileType, CheckCircle, User, LogOut, AlertCircle } from 'lucide-react';

export default function SingleVectorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [vector, setVector] = useState<any>(null);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [downloadError, setDownloadError] = useState('');
  
  // Download state
  const [downloadingType, setDownloadingType] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const fetchVector = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'vectors', id as string);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() } as any;
          setVector(data);
          
          // Fetch recommended vectors (same category)
          const q = query(
            collection(db, 'vectors'), 
            where('category', '==', data.category),
            limit(5)
          );
          const recSnap = await getDocs(q);
          const recData = recSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(d => d.id !== id) // Exclude current vector
            .slice(0, 4); // Keep only 4
            
          setRecommended(recData);
        }
      } catch (error) {
        console.error("Error fetching vector:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVector();
  }, [id]);

  const handleDownload = async (type: string, url: string) => {
    if (downloadingType) return; // Prevent multiple clicks
    setDownloadError('');

    if (!currentUser) {
      setDownloadError('Please log in to download vectors.');
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    try {
      // Check download limit
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      let currentCount = 0;
      let lastDate = '';

      if (userSnap.exists()) {
        const userData = userSnap.data();
        lastDate = userData.lastDownloadDate || '';
        currentCount = userData.downloadCount || 0;
      }

      if (lastDate === today && currentCount >= 5) {
        setDownloadError('You have reached your daily limit of 5 downloads. Please come back tomorrow!');
        return;
      }

      // If allowed, start countdown
      setDownloadingType(type);
      setCountdown(5);

      let counter = 5;
      const interval = setInterval(() => {
        counter -= 1;
        setCountdown(counter);
        
        if (counter <= 0) {
          clearInterval(interval);
          executeDownload(type, url, userRef, lastDate === today ? currentCount + 1 : 1, today);
        }
      }, 1000);

    } catch (error) {
      console.error("Error checking limits:", error);
      setDownloadError('Something went wrong. Please try again.');
    }
  };

  const executeDownload = async (type: string, url: string, userRef: any, newCount: number, today: string) => {
    try {
      // 1. Update user download count
      await setDoc(userRef, {
        downloadCount: newCount,
        lastDownloadDate: today
      }, { merge: true });

      // 2. Update vector download count in Firestore
      const vectorRef = doc(db, 'vectors', id as string);
      await updateDoc(vectorRef, { downloads: increment(1) });
      
      // Update local state to reflect new count
      setVector((prev: any) => ({ ...prev, downloads: (prev.downloads || 0) + 1 }));

      // 3. Trigger actual download via API route
      // Determine extension based on type if not explicitly provided
      let ext = type;
      if (type === 'video') ext = 'mp4';
      if (type === 'audio') ext = 'mp3';
      if (type === 'image') ext = 'jpg';
      if (type === 'vector') ext = 'svg';
      
      // Generate a random filename to hide the original name
      const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
      const filename = `VectorStock_${randomId}.${ext}`;
      window.location.href = `/api/download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
    } catch (error) {
      console.error("Download failed:", error);
      setDownloadError('Download failed. Please try again.');
    } finally {
      // Reset button state after a short delay
      setTimeout(() => {
        setDownloadingType(null);
      }, 2000);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!vector) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Vector not found</h1>
        <Link href="/" className="text-blue-600 hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="bg-blue-600 text-white p-1.5 rounded-lg">VS</span>
            <span className="hidden sm:inline">VectorStock Pro</span>
          </Link>
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        
        <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Vectors
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3">
            
            {/* Image Preview (Left Side) */}
            <div className="lg:col-span-2 bg-gray-100 p-8 flex items-center justify-center border-b lg:border-b-0 lg:border-r border-gray-100 relative min-h-[400px]">
              <Image 
                src={vector.mediumUrl || vector.jpgUrl || vector.url || 'https://i.ibb.co/placeholder.png'} 
                alt={vector.title} 
                fill
                className="object-contain p-8"
                referrerPolicy="no-referrer"
                priority
                unoptimized
              />
            </div>

            {/* Details & Download (Right Side) */}
            <div className="p-8 flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{vector.title}</h1>
              <p className="text-sm text-gray-500 mb-4">Category: <span className="font-medium text-gray-900">{vector.category}</span></p>
              
              {vector.description && (
                <p className="text-gray-600 text-sm mb-6 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {vector.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 mb-8 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  <span>{vector.downloads || 0} Downloads</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Free for commercial use</span>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="space-y-4 mt-auto">
                {downloadError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-200">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{downloadError}</span>
                  </div>
                )}
                
                <h3 className="font-medium text-gray-900 mb-2">Download Options</h3>
                
                {/* Dynamic Download Buttons based on fileType */}
                {(!vector.fileType || vector.fileType === 'vector') && vector.svgUrl && (
                  <button 
                    onClick={() => handleDownload('svg', vector.svgUrl)}
                    disabled={downloadingType !== null}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      downloadingType === 'svg' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 group'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileType className={`w-6 h-6 ${downloadingType === 'svg' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Vector Format (SVG)</p>
                        <p className="text-xs text-gray-500">Fully editable, scalable</p>
                      </div>
                    </div>
                    {downloadingType === 'svg' ? (
                      <span className="font-bold text-blue-600">
                        {countdown > 0 ? `Wait ${countdown}s...` : 'Starting...'}
                      </span>
                    ) : (
                      <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    )}
                  </button>
                )}

                {(vector.jpgUrl || vector.url) && (
                  <button 
                    onClick={() => handleDownload('jpg', vector.jpgUrl || vector.url)}
                    disabled={downloadingType !== null}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      downloadingType === 'jpg' 
                        ? 'border-blue-500 bg-blue-50 text-blue-700' 
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 group'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ImageIcon className={`w-6 h-6 ${downloadingType === 'jpg' ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'}`} />
                      <div className="text-left">
                        <p className="font-bold text-gray-900">Image Format (JPG/PNG)</p>
                        <p className="text-xs text-gray-500">Ready to use</p>
                      </div>
                    </div>
                    {downloadingType === 'jpg' ? (
                      <span className="font-bold text-blue-600">
                        {countdown > 0 ? `Wait ${countdown}s...` : 'Starting...'}
                      </span>
                    ) : (
                      <Download className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    )}
                  </button>
                )}
              </div>

              {/* Keywords */}
              {vector.keywords && vector.keywords.length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Keywords</h3>
                  <div className="flex flex-wrap gap-2">
                    {vector.keywords.map((keyword: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recommended Vectors */}
        {recommended.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You might also like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommended.map((rec) => (
                <Link href={`/vector/${rec.id}`} key={rec.id} className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 block">
                  <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                    <Image 
                      src={rec.mediumUrl || rec.thumbUrl || rec.jpgUrl || rec.url || 'https://i.ibb.co/placeholder.png'} 
                      alt={rec.title} 
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{rec.title}</h3>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">{rec.category}</p>
                      <p className="text-xs font-medium text-blue-600 capitalize">
                        {rec.fileType === 'image' ? 'Image' : 'Vector'}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

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
