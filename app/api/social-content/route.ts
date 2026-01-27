import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET all social content (with optional filtering by date range, status, platform)
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');

  try {
    let query = 'SELECT * FROM social_content WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (startDate) {
      query += ` AND post_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND post_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (status) {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (platform) {
      query += ` AND platform = $${paramIndex}`;
      params.push(platform);
      paramIndex++;
    }

    query += ' ORDER BY post_date ASC, created_at DESC';

    const result = params.length > 0
      ? await sql.query(query, params)
      : await sql.query(query);

    return NextResponse.json({
      content: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Error fetching social content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch social content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Create new social content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      post_date,
      week_of,
      content_type,
      platform,
      content_needs,
      asset_link,
      caption,
      status = 'draft',
      assigned_to,
      created_by
    } = body;

    if (!post_date || !week_of) {
      return NextResponse.json(
        { error: 'post_date and week_of are required' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO social_content (
        post_date, week_of, content_type, platform, content_needs,
        asset_link, caption, status, assigned_to, created_by
      )
      VALUES (
        ${post_date}, ${week_of}, ${content_type}, ${platform}, ${content_needs},
        ${asset_link}, ${caption}, ${status}, ${assigned_to}, ${created_by}
      )
      RETURNING *
    `;

    return NextResponse.json({
      message: 'Content created successfully',
      content: result.rows[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating social content:', error);
    return NextResponse.json(
      { error: 'Failed to create content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT - Update existing social content
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Content ID is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updateFields = Object.keys(updates)
      .filter(key => updates[key] !== undefined)
      .map((key, index) => `${key} = $${index + 2}`)
      .join(', ');

    if (!updateFields) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const values = Object.keys(updates)
      .filter(key => updates[key] !== undefined)
      .map(key => updates[key]);

    const query = `
      UPDATE social_content
      SET ${updateFields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

    const result = await sql.query(query, [id, ...values]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Content updated successfully',
      content: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating social content:', error);
    return NextResponse.json(
      { error: 'Failed to update content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete social content
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Content ID is required' },
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      DELETE FROM social_content
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Content deleted successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error deleting social content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
