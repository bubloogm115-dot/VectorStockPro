'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Trash2 } from 'lucide-react';

type FileData = {
  id: string;
  file: File;
  title: string;
  keywords: string;
  description: string;
  category: string;
};

export default function UploadVector() {
  const [fileDataList, setFileDataList] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      title: file.name.split('.').slice(0, -1).join('.'),
      keywords: '',
      description: '',
      category: 'Backgrounds'
    }));
    
    setFileDataList(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  };

  const removeFile = (id: string) => {
    setFileDataList(prev => prev.filter(f => f.id !== id));
  };

  const updateFileData = (id: string, field: keyof FileData, value: string) => {
    setFileDataList(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const convertSvgToJpgBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 1024;
        canvas.height = img.height || 1024;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject('Canvas toBlob failed');
        }, 'image/jpeg', 0.9);
      };
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(err);
      };
      img.src = url;
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (fileDataList.length === 0) {
      setStatus({ type: 'error', message: 'Please select at least one file to upload.' });
      return;
    }

    // Validate
    for (const data of fileDataList) {
      if (!data.title.trim() || !data.keywords.trim()) {
        setStatus({ type: 'error', message: 'Title and Keywords are compulsory for all images.' });
        return;
      }
    }

    setIsUploading(true);
    setStatus({ type: 'info', message: `Starting upload of ${fileDataList.length} files...` });
    setProgress({ current: 0, total: fileDataList.length });
    
    try {
      for (let i = 0; i < fileDataList.length; i++) {
        const data = fileDataList[i];
        const file = data.file;
        const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
        
        let imageUrl = '';
        let thumbUrl = '';
        let mediumUrl = '';
        let svgContent = '';

        if (isSvg) {
          // 1. Read SVG content to store directly in Firestore
          svgContent = await file.text();
          
          // Firestore has a 1MB limit per document. 
          // We'll leave some buffer for other fields (e.g. 900KB limit for SVG text)
          if (svgContent.length > 900000) {
            throw new Error(`SVG file ${file.name} is too large. Maximum allowed SVG size is ~900KB.`);
          }

          // 2. Convert SVG to JPG for ImgBB (thumbnails & jpg download)
          try {
            const jpgBlob = await convertSvgToJpgBlob(file);
            const formData = new FormData();
            formData.append('image', jpgBlob, file.name.replace(/\.svg$/i, '.jpg'));
            
            const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${process.env.NEXT_PUBLIC_IMGBB_API_KEY}`, {
              method: 'POST',
              body: formData,
            });
            const imgbbData = await imgbbRes.json();
            if (imgbbData.success) {
              imageUrl = imgbbData.data.url;
              thumbUrl = imgbbData.data.thumb?.url || imageUrl;
              mediumUrl = imgbbData.data.medium?.url || imageUrl;
            } else {
              throw new Error(imgbbData.error?.message || 'ImgBB upload failed');
            }
          } catch (err) {
            console.error("Failed to convert/upload SVG to JPG:", err);
            throw new Error(`Failed to process SVG ${file.name} for ImgBB upload.`);
          }
        } else {
          // Normal Image Upload to ImgBB
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
          
          imageUrl = imgbbData.data.url;
          thumbUrl = imgbbData.data.thumb?.url || imageUrl;
          mediumUrl = imgbbData.data.medium?.url || imageUrl;
        }

        const sanitizedKeywords = data.keywords.split(',')
          .map(k => k.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
          .filter(k => k);

        const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

        // Save Metadata to Firestore
        await addDoc(collection(db, 'vectors'), {
          title: data.title,
          slug,
          category: data.category,
          keywords: sanitizedKeywords,
          description: data.description.trim() || null,
          jpgUrl: imageUrl,
          thumbUrl: thumbUrl,
          mediumUrl: mediumUrl,
          ...(isSvg && { svgContent }),
          fileType: isSvg ? 'vector' : 'image',
          originalName: file.name,
          downloads: 0,
          createdAt: serverTimestamp(),
        });

        setProgress({ current: i + 1, total: fileDataList.length });
      }

      // Success! Reset form
      setStatus({ type: 'success', message: `Successfully uploaded ${fileDataList.length} files!` });
      setFileDataList([]);
      setProgress(null);

    } catch (error: any) {
      console.error("Upload error:", error);
      setStatus({ type: 'error', message: error.message || 'Something went wrong during upload.' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
          <UploadCloud className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Files</h1>
          <p className="text-gray-500 text-sm">Upload Images (JPG, PNG) and Vectors (SVG)</p>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <label className="block text-lg font-medium text-gray-900 mb-2">Select Files</label>
          <p className="text-sm text-gray-500 mb-6">Supports JPG, PNG, WEBP, SVG</p>
          <input 
            type="file" 
            multiple
            accept="image/jpeg, image/png, image/webp, image/svg+xml" 
            onChange={handleFileSelect}
            className="w-full max-w-md mx-auto text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
          />
        </div>
      </div>

      {fileDataList.length > 0 && (
        <form onSubmit={handleUpload} className="space-y-6">
          <div className="space-y-6">
            {fileDataList.map((data, index) => (
              <div key={data.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative">
                <button 
                  type="button"
                  onClick={() => removeFile(data.id)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-4 pr-8">
                  <span className="bg-blue-100 text-blue-700 font-bold w-8 h-8 flex items-center justify-center rounded-full shrink-0">
                    {index + 1}
                  </span>
                  <h3 className="font-semibold text-gray-900 truncate">{data.file.name}</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md shrink-0">
                    {(data.file.size / 1024).toFixed(1)} KB
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={data.title}
                      onChange={(e) => updateFileData(data.id, 'title', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Keywords <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={data.keywords}
                      onChange={(e) => updateFileData(data.id, 'keywords', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Comma separated"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={data.category}
                      onChange={(e) => updateFileData(data.id, 'category', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                    <input
                      type="text"
                      value={data.description}
                      onChange={(e) => updateFileData(data.id, 'description', e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="sticky bottom-6 z-10">
            <button
              type="submit"
              disabled={isUploading}
              className={`w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg transition-all flex justify-center items-center ${
                isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
              }`}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  Uploading & Saving...
                </>
              ) : (
                `Upload ${fileDataList.length} File(s)`
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
