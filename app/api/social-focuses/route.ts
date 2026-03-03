import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET — return all 3 focus rows
export async function GET() {
  try {
    const result = await sql`SELECT * FROM social_focuses ORDER BY sort_order`;
    return NextResponse.json({ focuses: result.rows });
  } catch (error) {
    console.error('Error fetching social focuses:', error);
    return NextResponse.json({ error: 'Failed to fetch focuses' }, { status: 500 });
  }
}

// PUT — update a single focus slot by sort_order
export async function PUT(request: NextRequest) {
  try {
    const { sort_order, title, description, target_value } = await request.json();
    if (!sort_order) return NextResponse.json({ error: 'sort_order is required' }, { status: 400 });

    const result = await sql`
      UPDATE social_focuses
      SET
        title        = ${title ?? ''},
        description  = ${description ?? null},
        target_value = ${target_value ?? null},
        updated_at   = CURRENT_TIMESTAMP
      WHERE sort_order = ${sort_order}
      RETURNING *
    `;

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Focus not found' }, { status: 404 });
    }

    return NextResponse.json({ focus: result.rows[0] });
  } catch (error) {
    console.error('Error updating social focus:', error);
    return NextResponse.json({ error: 'Failed to update focus' }, { status: 500 });
  }
}
