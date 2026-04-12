import { MetadataRoute } from 'next';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Replace with your actual domain when you go live
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';

  try {
    // Fetch all vectors from Firestore
    const vectorsSnapshot = await getDocs(collection(db, 'vectors'));
    
    const vectorUrls = vectorsSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        url: `${baseUrl}/vector/${doc.id}`,
        lastModified: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      };
    });

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
      ...vectorUrls,
    ];
  } catch (error) {
    console.error("Error generating sitemap:", error);
    // Fallback sitemap if database fetch fails
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      }
    ];
  }
}
