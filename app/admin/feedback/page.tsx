'use client';

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { MessageSquare, Trash2, Loader2, User } from 'lucide-react';

export default function ManageFeedback() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const feedbackData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedbacks(feedbackData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await deleteDoc(doc(db, 'feedback', id));
      } catch (error) {
        console.error("Error deleting feedback:", error);
        alert("Failed to delete feedback.");
      }
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
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-orange-100 p-3 rounded-lg text-orange-600">
          <MessageSquare className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Feedback</h1>
          <p className="text-gray-500 text-sm">Read what your users are saying</p>
        </div>
      </div>

      <div className="space-y-4">
        {feedbacks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p>No feedback received yet.</p>
          </div>
        ) : (
          feedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4">
              <div className="bg-gray-100 p-3 rounded-full h-fit">
                <User className="w-6 h-6 text-gray-500" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{feedback.name || 'Anonymous User'}</h3>
                    <p className="text-sm text-gray-500">{feedback.email || 'No email provided'}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {feedback.createdAt?.toDate ? feedback.createdAt.toDate().toLocaleDateString() : 'Just now'}
                  </span>
                </div>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg mt-3 border border-gray-100">
                  {feedback.message}
                </p>
              </div>
              <div>
                <button 
                  onClick={() => handleDelete(feedback.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                  title="Delete Feedback"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
