'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Image as ImageIcon, Trash2, Edit, Loader2, Save, X, Search } from 'lucide-react';
import SkeletonImage from '@/components/SkeletonImage';

export default function ManageVectors() {
  const [vectors, setVectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit Form State
  const [editData, setEditData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'vectors'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setVectors(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this image/vector permanently?')) {
      try {
        await deleteDoc(doc(db, 'vectors', id));
      } catch (error) {
        console.error("Error deleting:", error);
        alert("Failed to delete.");
      }
    }
  };

  const handleEditClick = (vector: any) => {
    setEditingId(vector.id);
    setEditData({
      title: vector.title || '',
      description: vector.description || '',
      category: vector.category || '',
      keywords: (vector.keywords || []).join(', ')
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleSave = async (id: string) => {
    setIsSaving(true);
    try {
      const sanitizedKeywords = editData.keywords.split(',')
        .map((k: string) => k.replace(/[^a-zA-Z\s]/g, '').replace(/\s+/g, ' ').trim().toLowerCase())
        .filter((k: string) => k);

      const slug = editData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      await updateDoc(doc(db, 'vectors', id), {
        title: editData.title,
        slug,
        description: editData.description,
        category: editData.category,
        keywords: sanitizedKeywords,
      });
      setEditingId(null);
    } catch (error) {
      console.error("Error updating:", error);
      alert("Failed to update.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredVectors = vectors.filter(v => 
    (v.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (v.originalName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 p-3 rounded-lg text-purple-600">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Images</h1>
            <p className="text-gray-500 text-sm">Edit metadata or remove uploaded images & vectors</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Preview</th>
                <th className="px-6 py-4">Metadata</th>
                <th className="px-6 py-4">Stats</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredVectors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No images found.
                  </td>
                </tr>
              ) : (
                filteredVectors.map((vector) => {
                  const isEditing = editingId === vector.id;

                  return (
                    <tr key={vector.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 align-top w-48">
                        <SkeletonImage 
                          src={vector.mediumUrl || vector.jpgUrl || vector.url || 'https://i.ibb.co/placeholder.png'} 
                          alt={vector.title}
                          fill
                          className="object-cover"
                          sizes="128px"
                          wrapperClassName="relative w-32 h-24 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                          skeletonClassName="bg-gray-200 animate-pulse w-full h-full"
                        />
                        <div className="mt-2 text-xs text-gray-500 truncate max-w-[8rem]" title={vector.originalName}>
                          {vector.originalName || 'unknown_file'}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 align-top">
                        {isEditing ? (
                          <div className="space-y-3 max-w-md">
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Title</label>
                              <input 
                                type="text"
                                value={editData.title}
                                onChange={e => setEditData({...editData, title: e.target.value})}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Category</label>
                              <select
                                value={editData.category}
                                onChange={e => setEditData({...editData, category: e.target.value})}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                              >
                                <option value="Backgrounds">Backgrounds</option>
                                <option value="Icons">Icons</option>
                                <option value="Illustrations">Illustrations</option>
                                <option value="Patterns">Patterns</option>
                                <option value="Nature">Nature</option>
                                <option value="Abstract">Abstract</option>
                                <option value="Business">Business</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Keywords (comma separated)</label>
                              <input 
                                type="text"
                                value={editData.keywords}
                                onChange={e => setEditData({...editData, keywords: e.target.value})}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-medium text-gray-500 mb-1 block">Description</label>
                              <textarea 
                                value={editData.description}
                                onChange={e => setEditData({...editData, description: e.target.value})}
                                rows={2}
                                className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1.5">
                            <h3 className="font-bold text-gray-900">{vector.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2 max-w-md">{vector.description || 'No description'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                                {vector.category}
                              </span>
                              <span className="text-xs text-blue-600 truncate max-w-xs block">
                                {(vector.keywords || []).join(', ')}
                              </span>
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4 align-top text-gray-500">
                        <div className="space-y-1 text-xs">
                          <p><span className="font-medium text-gray-700">Downloads:</span> {vector.downloads || 0}</p>
                          <p><span className="font-medium text-gray-700">Type:</span> {vector.fileType === 'vector' ? 'Vector (SVG)' : 'Image (JPG/PNG)'}</p>
                          <p><span className="font-medium text-gray-700">Date:</span> {vector.createdAt?.toDate ? vector.createdAt.toDate().toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-top text-right space-y-2 w-32">
                        {isEditing ? (
                          <div className="flex flex-col gap-2 justify-end">
                            <button
                              onClick={() => handleSave(vector.id)}
                              disabled={isSaving}
                              className="text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              <span>Save</span>
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                            >
                              <X className="w-4 h-4" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleEditClick(vector)}
                              className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                              title="Edit Image"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(vector.id)}
                              className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100"
                              title="Delete Image"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
