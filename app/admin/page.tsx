'use client';

import React, { useEffect, useState } from 'react';
import { Download, Image as ImageIcon, Users, Eye, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState({ vectors: 0, downloads: 0, users: 0, views: 0 });
  const [recentVectors, setRecentVectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'vectors'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalDownloads = 0;
      const vectorsData = snapshot.docs.map(doc => {
        const data = doc.data();
        totalDownloads += (data.downloads || 0);
        return { id: doc.id, ...data };
      });
      
      setStatsData(prev => ({ ...prev, vectors: vectorsData.length, downloads: totalDownloads }));
      setRecentVectors(vectorsData.slice(0, 5)); // top 5 recent
      setLoading(false);
    });

    // Listen to users count
    const usersQ = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQ, (snapshot) => {
      setStatsData(prev => ({ ...prev, users: snapshot.docs.length }));
    });

    return () => {
      unsubscribe();
      unsubscribeUsers();
    };
  }, []);

  const stats = [
    { name: 'Total Vectors', value: statsData.vectors.toString(), icon: ImageIcon, color: 'bg-blue-500' },
    { name: 'Total Downloads', value: statsData.downloads.toString(), icon: Download, color: 'bg-green-500' },
    { name: 'Total Users', value: statsData.users.toString(), icon: Users, color: 'bg-purple-500' },
    { name: 'Page Views', value: statsData.views.toString(), icon: Eye, color: 'bg-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
              <div className={`${stat.color} p-4 rounded-lg text-white`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Uploads</h2>
        {recentVectors.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            <ImageIcon className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No vectors uploaded yet. Go to "Upload Vector" to add your first file.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentVectors.map(vector => (
              <div key={vector.id} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                <img src={vector.jpgUrl} alt={vector.title} className="w-16 h-16 object-cover rounded bg-gray-100" />
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{vector.title}</h3>
                  <p className="text-sm text-gray-500">{vector.category}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {vector.downloads || 0} downloads
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
