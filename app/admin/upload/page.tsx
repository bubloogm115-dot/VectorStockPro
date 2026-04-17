'use client';

import React, { useState, useRef, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { UploadCloud, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, Trash2, FileSpreadsheet } from 'lucide-react';
import Papa from 'papaparse';
import Image from 'next/image';

type FileData = {
  id: string;
  file: File;
  title: string;
  keywords: string;
  description: string;
  category: string;
  previewUrl: string;
};

export default function UploadVector() {
  const [fileDataList, setFileDataList] = useState<FileData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs to prevent memory leaks when component unmounts or fileDataList changes
  useEffect(() => {
    return () => {
      fileDataList.forEach(data => URL.revokeObjectURL(data.previewUrl));
    };
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      title: file.name.split('.').slice(0, -1).join('.'),
      keywords: '',
      description: '',
      category: 'Backgrounds',
      previewUrl: URL.createObjectURL(file)
    }));
    
    setFileDataList(prev => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  };

  const handleCsvSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setStatus({ type: 'info', message: 'Reading CSV file...' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as any[];
        
        if (rows.length === 0) {
          setStatus({ type: 'error', message: 'The CSV file is empty or invalid.' });
          return;
        }

        const firstRow = rows[0];
        if (!('filename' in firstRow)) {
          setStatus({ type: 'error', message: 'CSV must contain a "filename" column.' });
          return;
        }

        let updatedCount = 0;

        setFileDataList(prev => prev.map(fileData => {
          // Find matching row by filename
          const matchingRow = rows.find(row => row.filename === fileData.file.name);
          
          if (matchingRow) {
            updatedCount++;
            return {
              ...fileData,
              title: matchingRow.title || fileData.title,
              keywords: matchingRow.keywords || fileData.keywords,
              description: matchingRow.description || fileData.description,
              category: matchingRow.category || fileData.category
            };
          }
          return fileData;
        }));

        setStatus({ 
          type: 'success', 
          message: `Successfully mapped metadata to ${updatedCount} files from CSV!` 
        });
        
        // Reset CSV Input
        if (csvInputRef.current) {
          csvInputRef.current.value = '';
        }
      },
      error: (error) => {
        setStatus({ type: 'error', message: `Error parsing CSV: ${error.message}` });
      }
    });
  };

  const removeFile = (id: string) => {
    setFileDataList(prev => {
      const filtered = prev.filter(f => f.id !== id);
      // Revoke the URL of the removed file to free memory
      const removedFile = prev.find(f => f.id === id);
      if (removedFile) URL.revokeObjectURL(removedFile.previewUrl);
      return filtered;
    });
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors h-full flex flex-col justify-center">
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label className="block text-lg font-medium text-gray-900 mb-2">Select Images/Vectors</label>
            <p className="text-sm text-gray-500 mb-6">Supports JPG, PNG, WEBP, SVG</p>
            <input 
              type="file" 
              multiple
              accept="image/jpeg, image/png, image/webp, image/svg+xml" 
              onChange={handleFileSelect}
              className="w-full max-w-md mx-auto text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div className="border-2 border-dashed border-green-300 bg-green-50/50 rounded-xl p-8 text-center hover:border-green-500 transition-colors h-full flex flex-col justify-center">
            <FileSpreadsheet className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <label className="block text-lg font-medium text-green-900 mb-2">Auto-fill via CSV</label>
            <p className="text-sm text-green-700/70 mb-6 px-4">Instantly populate metadata for your selected images. CSV must have a <strong className="font-bold text-green-800">`filename`</strong> column matching original file names.</p>
            <input 
              type="file" 
              accept=".csv"
              ref={csvInputRef}
              onChange={handleCsvSelect}
              disabled={fileDataList.length === 0}
              title={fileDataList.length === 0 ? "Please select images first before uploading CSV" : "Select CSV metadata file"}
              className={`w-full max-w-md mx-auto text-sm text-green-600 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-100 file:text-green-800 hover:file:bg-green-200 cursor-pointer ${fileDataList.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>
        </div>
      </div>

      {fileDataList.length > 0 && (
        <form onSubmit={handleUpload} className="relative">
          <div className="flex flex-col lg:flex-row gap-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            
            {/* Left: Horizontal/Wrapped Previews */}
            <div className="lg:w-5/12">
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-semibold text-gray-900">Uploaded Images ({fileDataList.length})</h3>
              </div>
              {/* Thumbnails wrapper */}
              <div className="flex flex-row flex-wrap gap-4 max-h-[600px] overflow-y-auto p-1 custom-scrollbar">
                 {fileDataList.map((data, index) => (
                   <div 
                     key={data.id}
                     onClick={() => {
                        const activeItem = document.getElementById(`metadata-form-${data.id}`);
                        if (activeItem) {
                           activeItem.scrollIntoView({ behavior: 'smooth', block: 'end' });
                        }
                     }}
                     className="relative cursor-pointer rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all w-24 h-24 shrink-0"
                   >
                     <Image src={data.previewUrl} alt={data.title} fill className="object-cover" unoptimized />
                     <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(data.id); }} className="absolute top-1 right-1 bg-white/80 p-1 rounded-md text-red-500 hover:text-red-700 hover:bg-white transition-colors">
                        <Trash2 className="w-3 h-3" />
                     </button>
                     <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-tr-md">
                       #{index + 1}
                     </div>
                   </div>
                 ))}
              </div>
            </div>

            {/* Right: Scrollable Metadata Forms */}
            <div className="lg:w-7/12 flex flex-col gap-6 max-h-[600px] overflow-y-auto p-1 custom-scrollbar pr-4">
              {fileDataList.map((data, index) => (
                <div id={`metadata-form-${data.id}`} key={data.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4 md:p-6 flex flex-col gap-4 relative">
                  <button 
                    type="button"
                    onClick={() => removeFile(data.id)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors z-10"
                    title="Remove Image"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                  
                  {/* Active Header Item */}
                  <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                     <div className="w-16 h-16 relative rounded-md overflow-hidden border border-gray-200 bg-white shrink-0">
                        <Image src={data.previewUrl} alt={data.file.name} fill className="object-contain" unoptimized />
                     </div>
                     <div className="flex-1 pr-8">
                       <h2 className="text-base font-bold text-gray-900 border-none p-0 bg-transparent flex items-center gap-2">Image #{index + 1}</h2>
                       <p className="text-xs text-gray-500 truncate mt-0.5" title={data.file.name}>
                          {data.file.name} ({(data.file.size / 1024).toFixed(1)} KB)
                       </p>
                     </div>
                  </div>

                  {/* Metadata Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={data.title}
                        onChange={(e) => updateFileData(data.id, 'title', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Keywords <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={data.keywords}
                        onChange={(e) => updateFileData(data.id, 'keywords', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="e.g. car, red, fast"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={data.category}
                        onChange={(e) => updateFileData(data.id, 'category', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
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
                      <label className="block text-xs font-medium text-gray-700 mb-1">Description (Optional)</label>
                      <textarea
                        value={data.description}
                        onChange={(e) => updateFileData(data.id, 'description', e.target.value)}
                        rows={1}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
