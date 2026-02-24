import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    // Use Postgres date_trunc('week', post_date) to calculate the correct Monday.
    // This avoids all JS timezone issues — Postgres ISO weeks always start on Monday.
    const result = await sql`
      UPDATE social_content
      SET week_of = date_trunc('week', post_date::date)::date
    `;

    // Count all rows to report how many were processed
    const countResult = await sql`SELECT COUNT(*) as count FROM social_content`;
    const updatedCount = parseInt(countResult.rows[0]?.count || '0');

    return NextResponse.json({
      success: true,
      message: `Fixed week_of for ${updatedCount} posts`,
      updatedCount
    });
  } catch (error) {
    console.error('Error fixing week_of values:', error);
    return NextResponse.json(
      { error: 'Failed to fix week_of values', details: error },
      { status: 500 }
    );
  }
}
