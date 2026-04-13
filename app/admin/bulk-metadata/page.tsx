'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';

type CsvRow = {
  filename: string;
  title: string;
  description: string;
  keywords: string;
  category: string;
};

export default function BulkMetadataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number, success: number, failed: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus(null);
      setProgress(null);
    }
  };

  const processCsv = async () => {
    if (!file) {
      setStatus({ type: 'error', message: 'Please select a CSV file first.' });
      return;
    }

    setIsProcessing(true);
    setStatus({ type: 'info', message: 'Reading CSV file...' });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as CsvRow[];
        
        if (rows.length === 0) {
          setStatus({ type: 'error', message: 'The CSV file is empty or invalid.' });
          setIsProcessing(false);
          return;
        }

        // Validate headers
        const firstRow = rows[0];
        if (!('filename' in firstRow)) {
          setStatus({ type: 'error', message: 'CSV must contain a "filename" column.' });
          setIsProcessing(false);
          return;
        }

        setStatus({ type: 'info', message: `Processing ${rows.length} rows...` });
        setProgress({ current: 0, total: rows.length, success: 0, failed: 0 });

        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          try {
            if (!row.filename) {
              failedCount++;
              continue;
            }

            // Find the vector by originalName
            const q = query(collection(db, 'vectors'), where('originalName', '==', row.filename));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              console.warn(`No vector found with filename: ${row.filename}`);
              failedCount++;
            } else {
              // Update all matching documents (usually just one)
              for (const document of querySnapshot.docs) {
                const updateData: any = {};
                
                if (row.title) {
                  updateData.title = row.title;
                  updateData.slug = row.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                }
                if (row.description !== undefined) updateData.description = row.description;
                if (row.category) updateData.category = row.category;
                if (row.keywords) {
                  const sanitizedKeywords = row.keywords.split(',')
                    .map(k => k.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
                    .filter(k => k);
                  updateData.keywords = sanitizedKeywords;
                }

                if (Object.keys(updateData).length > 0) {
                  await updateDoc(doc(db, 'vectors', document.id), updateData);
                }
              }
              successCount++;
            }
          } catch (error) {
            console.error(`Error processing row ${i + 1} (${row.filename}):`, error);
            failedCount++;
          }

          setProgress({ current: i + 1, total: rows.length, success: successCount, failed: failedCount });
        }

        setStatus({ 
          type: 'success', 
          message: `Finished processing! Successfully updated ${successCount} images. ${failedCount > 0 ? `Failed to find or update ${failedCount} images.` : ''}` 
        });
        setIsProcessing(false);
      },
      error: (error) => {
        setStatus({ type: 'error', message: `Error parsing CSV: ${error.message}` });
        setIsProcessing(false);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
          <FileSpreadsheet className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Metadata Update</h1>
          <p className="text-gray-500 text-sm mt-1">Upload a CSV file to update titles, descriptions, and keywords for existing images.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CSV Format Requirements</h2>
        <p className="text-gray-600 text-sm mb-4">
          Your CSV file must include a header row with the following column names. The <strong>filename</strong> column is required to match the image. Other columns are optional.
        </p>
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100">
              <tr>
                <th className="px-4 py-2">filename (Required)</th>
                <th className="px-4 py-2">title</th>
                <th className="px-4 py-2">description</th>
                <th className="px-4 py-2">keywords</th>
                <th className="px-4 py-2">category</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b">
                <td className="px-4 py-2 font-mono text-xs">image1.jpg</td>
                <td className="px-4 py-2">Beautiful Sunset</td>
                <td className="px-4 py-2">A beautiful sunset over the ocean.</td>
                <td className="px-4 py-2">sunset, ocean, nature</td>
                <td className="px-4 py-2">Nature</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">vector_art.svg</td>
                <td className="px-4 py-2">Abstract Shapes</td>
                <td className="px-4 py-2"></td>
                <td className="px-4 py-2">abstract, shapes, colorful</td>
                <td className="px-4 py-2">Abstract</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
                <p className="mb-2 text-sm text-gray-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">CSV files only</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
            </label>
          </div>
          {file && (
            <div className="mt-4 p-3 bg-blue-50 text-blue-700 rounded-lg flex items-center justify-between">
              <span className="text-sm font-medium truncate">{file.name}</span>
              <span className="text-xs bg-blue-100 px-2 py-1 rounded-full">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        {status && (
          <div className={`p-4 rounded-xl mb-6 flex items-start space-x-3 ${
            status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
            'bg-blue-50 text-blue-700 border border-blue-100'
          }`}>
            {status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : 
             status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" /> :
             <Loader2 className="w-5 h-5 shrink-0 mt-0.5 animate-spin" />}
            <div>
              <p className="font-medium">{status.message}</p>
              
              {progress && (
                <div className="mt-3 w-full max-w-md">
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progress: {progress.current} / {progress.total}</span>
                    <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                  </div>
                  <div className="w-full bg-blue-200/50 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-green-600 font-medium">Success: {progress.success}</span>
                    <span className="text-red-600 font-medium">Failed/Not Found: {progress.failed}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={processCsv}
            disabled={!file || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                <span>Update Metadata</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
