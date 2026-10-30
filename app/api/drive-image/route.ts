import { NextRequest, NextResponse } from 'next/server';
import { getDriveToken, isValidDriveId } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

// GET ?id=<fileId> — stream a Drive image through the service account so
// viewers see previews without needing access to the Drive folder themselves.
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!isValidDriveId(id)) {
    return NextResponse.json({ error: 'Valid file id is required' }, { status: 400 });
  }

  try {
    const token = await getDriveToken();
    const headers = { Authorization: `Bearer ${token}` };

    const meta = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?fields=mimeType&supportsAllDrives=true`, { headers });
    if (!meta.ok) return NextResponse.json({ error: 'File not found' }, { status: 404 });
    const { mimeType } = await meta.json();
    if (!String(mimeType).startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 415 });
    }

    const file = await fetch(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, { headers });
    if (!file.ok || !file.body) return NextResponse.json({ error: 'Could not load image' }, { status: 502 });

    return new NextResponse(file.body, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, s-maxage=86400, max-age=3600, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Error loading Drive image:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
