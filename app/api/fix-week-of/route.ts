import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  try {
    // Get all social_content records
    const result = await sql`
      SELECT id, post_date FROM social_content
    `;

    let updatedCount = 0;

    // Fix each record's week_of calculation
    for (const record of result.rows) {
      const postDate = new Date(record.post_date);
      const dayOfWeek = postDate.getDay();

      // Calculate Monday of the week
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const monday = new Date(postDate);
      monday.setDate(postDate.getDate() + diff);
      const weekOf = monday.toISOString().split('T')[0];

      // Update the record
      await sql`
        UPDATE social_content
        SET week_of = ${weekOf}
        WHERE id = ${record.id}
      `;

      updatedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${updatedCount} posts`,
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
