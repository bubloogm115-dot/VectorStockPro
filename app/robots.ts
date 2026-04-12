import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  // Replace with your actual domain when you go live
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://your-domain.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/'], // Hide admin and API routes from Google
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
