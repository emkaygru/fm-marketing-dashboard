import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// GET - Fetch all blog posts or filter by date range
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let result;
    if (startDate && endDate) {
      result = await sql`
        SELECT * FROM blog_posts
        WHERE publish_date BETWEEN ${startDate} AND ${endDate}
        ORDER BY publish_date ASC
      `;
    } else {
      result = await sql`
        SELECT * FROM blog_posts
        ORDER BY publish_date DESC
      `;
    }

    return NextResponse.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts', details: error },
      { status: 500 }
    );
  }
}

// POST - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { title, topic, author, publish_date, link, status, doc_link } = data;

    const result = await sql`
      INSERT INTO blog_posts (title, topic, author, publish_date, link, status, doc_link)
      VALUES (${title}, ${topic || null}, ${author}, ${publish_date}, ${link || null}, ${status || 'draft'}, ${doc_link || null})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post', details: error },
      { status: 500 }
    );
  }
}

// PUT - Update blog post
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, title, topic, author, publish_date, link, status, doc_link, beth_complete } = data;

    const result = await sql`
      UPDATE blog_posts
      SET
        title = COALESCE(${title ?? null}, title),
        topic = COALESCE(${topic ?? null}, topic),
        author = COALESCE(${author ?? null}, author),
        publish_date = COALESCE(${publish_date ?? null}, publish_date),
        link = COALESCE(${link ?? null}, link),
        status = COALESCE(${status ?? null}, status),
        doc_link = COALESCE(${doc_link ?? null}, doc_link),
        beth_complete = COALESCE(${beth_complete ?? null}, beth_complete),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

    // Notify Emily when Beth updates a blog post (doc_link or mark-complete)
    const isBethUpdate = doc_link !== undefined || beth_complete !== undefined;
    if (isBethUpdate) {
      try {
        await sql`
          INSERT INTO notifications (type, message, author_name)
          VALUES ('beth_blog', 'Beth updated a blog post', 'Beth')
        `;
      } catch { /* non-fatal */ }
    }

    return NextResponse.json({
      success: true,
      post: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post', details: error },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Blog post ID is required' },
        { status: 400 }
      );
    }

    await sql`DELETE FROM blog_posts WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post', details: error },
      { status: 500 }
    );
  }
}
