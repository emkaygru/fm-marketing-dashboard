import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET — list all saved captions, newest first
export async function GET() {
  try {
    const result = await sql`
      SELECT id, text, platform, source, notes, original_date, original_permalink, created_at
      FROM caption_bank
      ORDER BY created_at DESC
    `;

    const captions = result.rows.map((row) => ({
      ...row,
      original_date: row.original_date
        ? new Date(row.original_date).toISOString().slice(0, 10)
        : null,
    }));

    return NextResponse.json({ captions });
  } catch (error) {
    console.error('Error fetching saved captions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved captions' },
      { status: 500 }
    );
  }
}

// POST — save a new caption to the bank
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, platform, source, notes, original_date, original_permalink } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Caption text is required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO caption_bank (text, platform, source, notes, original_date, original_permalink)
      VALUES (
        ${text.trim()},
        ${platform || null},
        ${source || 'manual'},
        ${notes || null},
        ${original_date || null},
        ${original_permalink || null}
      )
      RETURNING id, text, platform, source, notes, original_date, original_permalink, created_at
    `;

    const saved = result.rows[0];
    return NextResponse.json({
      caption: {
        ...saved,
        original_date: saved.original_date
          ? new Date(saved.original_date).toISOString().slice(0, 10)
          : null,
      },
    });
  } catch (error) {
    console.error('Error saving caption:', error);
    return NextResponse.json(
      { error: 'Failed to save caption' },
      { status: 500 }
    );
  }
}

// DELETE — remove a saved caption by id
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Caption id is required' }, { status: 400 });
    }

    await sql`DELETE FROM caption_bank WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting caption:', error);
    return NextResponse.json(
      { error: 'Failed to delete caption' },
      { status: 500 }
    );
  }
}
