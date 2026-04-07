import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const fileUrl = searchParams.get('url');
  const filename = searchParams.get('filename') || 'download';

  if (!fileUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  try {
    const response = await fetch(fileUrl);
    
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
  } catch (error) {
    console.error('Download API Error:', error);
    return new NextResponse('Error downloading file', { status: 500 });
  }
}
