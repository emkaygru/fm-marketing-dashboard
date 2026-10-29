import { NextRequest, NextResponse } from 'next/server';
import { getDriveToken, getServiceAccountEmail, isValidDriveId } from '@/lib/googleDrive';

export const dynamic = 'force-dynamic';

// GET ?id=<folderId> — list the images in a Drive folder, sorted by filename
// (natural order, so Slide_2 comes before Slide_10; _01, _02 naming works best).
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  if (!isValidDriveId(id)) {
    return NextResponse.json({ error: 'Valid folder id is required' }, { status: 400 });
  }

  try {
    const token = await getDriveToken();
    const q = encodeURIComponent(`'${id}' in parents and mimeType contains 'image/' and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType)&pageSize=100&supportsAllDrives=true&includeItemsFromAllDrives=true`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Could not read folder', serviceAccount: getServiceAccountEmail(), status: res.status },
        { status: res.status === 404 ? 404 : 502 }
      );
    }
    const data = await res.json();
    const files = (data.files || [])
      .map((f: { id: string; name: string }) => ({ id: f.id, name: f.name }))
      .sort((a: { name: string }, b: { name: string }) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );

    return NextResponse.json({ files }, { headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=3600' } });
  } catch (error) {
    console.error('Error listing Drive folder:', error);
    return NextResponse.json(
      { error: 'Failed to list folder', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
