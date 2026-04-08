'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadVector() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Backgrounds');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!files || files.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one image to upload.' });
      return;
    }

    setIsUploading(true);
    setStatus({ type: 'info', message: `Starting upload of ${files.length} images to ImgBB...` });
    setProgress({ current: 0, total: files.length });
    
    try {
      const sanitizedKeywords = keywords.split(',')
        .map(k => k.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
        .filter(k => k);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload to ImgBB
        const formData = new FormData();
        formData.append('image', file);
        
        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
          method: 'POST',
          body: formData,
        });
        const imgbbData = await imgbbRes.json();
        
        if (!imgbbData.success) {
          throw new Error(imgbbData.error?.message || `Failed to upload ${file.name} to ImgBB`);
        }
        
        const imageUrl = imgbbData.data.url;

        // Generate Title and Slug
        const fileBaseName = file.name.split('.').slice(0, -1).join('.');
        const finalTitle = title ? (files.length > 1 ? `${title} ${i + 1}` : title) : fileBaseName;
        const slug = finalTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // Save Metadata to Firestore
        await addDoc(collection(db, 'vectors'), {
          title: finalTitle,
          slug,
          category,
          keywords: sanitizedKeywords,
          description: description.trim() || null,
          jpgUrl: imageUrl,
          fileType: 'image',
          originalName: file.name,
          downloads: 0,
          createdAt: serverTimestamp(),
        });

        setProgress({ current: i + 1, total: files.length });
      }

      // Success! Reset form
      setStatus({ type: 'success', message: `Successfully uploaded ${files.length} images!` });
      setTitle('');
      setKeywords('');
      setDescription('');
      setFiles(null);
      setProgress(null);
      
      // Clear file inputs
      const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
      fileInputs.forEach(input => input.value = '');

    } catch (error: any) {
      console.error("Upload error:", error);
      setStatus({ type: 'error', message: error.message || 'Something went wrong during upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Images</h1>
          <p className="text-gray-500 text-sm">Upload multiple images (JPG, PNG, WEBP) to ImgBB</p>
        </div>
      </div>

      {status && (
        <div className={`p-4 rounded-lg mb-6 flex items-center space-x-3 ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
          status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
          'bg-blue-50 text-blue-700 border border-blue-200'
        }`}>
          {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : 
           status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : 
           <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
          <div className="flex-1">
            <span className="font-medium">{status.message}</span>
            {progress && (
              <div className="w-full bg-blue-200 rounded-full h-2.5 mt-2">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all" style={{ width: `${(progress.current / progress.total) * 100}%` }}></div>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
        
        {/* File Uploads */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <label className="block text-lg font-medium text-gray-900 mb-2">Select Images (Bulk Upload)</label>
          <p className="text-sm text-gray-500 mb-6">Supports JPG, PNG, WEBP, GIF (ImgBB Supported)</p>
          <input 
            type="file" 
            multiple
            accept="image/jpeg, image/png, image/webp, image/gif" 
            required
            onChange={(e) => setFiles(e.target.files)}
            className="w-full max-w-md mx-auto text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
          {files && files.length > 0 && (
            <p className="mt-4 text-sm font-medium text-blue-600">{files.length} image(s) selected</p>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Metadata */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Base Title (Optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Leave blank to use original file names"
            />
            <p className="text-xs text-gray-500 mt-1">If uploading multiple files, numbers will be appended (e.g., Title 1, Title 2).</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Add a description for the image(s)..."
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
              >
                <option value="Backgrounds">Backgrounds</option>
                <option value="Illustrations">Illustrations</option>
                <option value="Icons">Icons</option>
                <option value="Patterns">Patterns</option>
                <option value="Templates">Templates</option>
                <option value="Photos">Photos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (Comma separated)</label>
              <input
                type="text"
                required
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="abstract, blue, geometric, modern"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isUploading}
          className={`w-full py-3 rounded-lg font-semibold text-white transition-colors flex justify-center items-center ${
            isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isUploading ? 'Uploading & Saving...' : 'Upload Images'}
        </button>
      </form>
    </div>
  );
}
