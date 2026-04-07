'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { FileText, Plus, Trash2, Loader2, Image as ImageIcon, X } from 'lucide-react';

export default function ManageBlog() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deleteDoc(doc(db, 'blog', id));
      } catch (error) {
        console.error("Error deleting post:", error);
        alert("Failed to delete post.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !imageFile) {
      alert("Please fill all fields and select an image.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload Image to ImgBB
      const formData = new FormData();
      formData.append('image', imageFile);
      
      const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
        method: 'POST',
        body: formData,
      });
      const imgbbData = await imgbbRes.json();
      
      if (!imgbbData.success) throw new Error('Failed to upload image');
      const imageUrl = imgbbData.data.url;

      // Save to Firestore
      await addDoc(collection(db, 'blog'), {
        title,
        content,
        imageUrl,
        createdAt: serverTimestamp()
      });

      // Reset form
      setTitle('');
      setContent('');
      setImageFile(null);
      setIsCreating(false);
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 p-3 rounded-lg text-green-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Blog Posts</h1>
            <p className="text-gray-500 text-sm">Manage your blog content</p>
          </div>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          {isCreating ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {isCreating ? 'Cancel' : 'New Post'}
        </button>
      </div>

      {isCreating && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Create New Post</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Post Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="Enter post title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image (JPG/PNG)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input 
                  type="file" 
                  accept="image/jpeg, image/png" 
                  required
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                placeholder="Write your blog post content here..."
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publish Post'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            No blog posts found. Create one to get started!
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
              <div className="aspect-video bg-gray-100 relative">
                <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{post.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4 flex-1">{post.content}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
