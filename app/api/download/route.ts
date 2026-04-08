import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Set max duration to 60 seconds

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'download';

  if (!fileUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 50000); // 50 seconds timeout

    const response = await fetch(fileUrl, {
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const headers = new Headers(response.headers);
    // Force download by setting Content-Disposition to attachment
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);
    // Remove headers that might cause issues when proxying
    headers.delete('content-encoding');

    return new NextResponse(response.body, {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error('Download API Error:', error);
    
    // If it's a timeout or fetch error, we can fallback to redirecting the user to the original URL
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
      return NextResponse.redirect(fileUrl);
    }
    
    return new NextResponse('Error downloading file', { status: 500 });
  }
}
