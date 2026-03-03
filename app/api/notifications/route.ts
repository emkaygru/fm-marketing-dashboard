import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Return recent notifications (last 30)
export async function GET() {
  try {
    const result = await sql`
      SELECT
        n.id,
        n.type,
        n.message,
        n.content_id,
        n.comment_id,
        n.author_name,
        n.created_at,
        sc.content_needs AS post_title,
        sc.post_date
      FROM notifications n
      LEFT JOIN social_content sc ON sc.id = n.content_id
      ORDER BY n.created_at DESC
      LIMIT 30
    `;

    return NextResponse.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Clear all notifications (mark-as-read is handled client-side via localStorage)
export async function DELETE() {
  try {
    await sql`DELETE FROM notifications`;
    return NextResponse.json({ message: 'Notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}
