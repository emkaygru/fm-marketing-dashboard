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
    const { title, topic, author, publish_date, link, status } = data;

    // Validate publish_date is a Wednesday
    const date = new Date(publish_date);
    if (date.getDay() !== 3) {
      return NextResponse.json(
        { error: 'Publish date must be a Wednesday' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO blog_posts (title, topic, author, publish_date, link, status)
      VALUES (${title}, ${topic || null}, ${author}, ${publish_date}, ${link || null}, ${status || 'draft'})
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
    const { id, title, topic, author, publish_date, link, status } = data;

    // If publish_date is being updated, validate it's a Wednesday
    if (publish_date) {
      const date = new Date(publish_date);
      if (date.getDay() !== 3) {
        return NextResponse.json(
          { error: 'Publish date must be a Wednesday' },
          { status: 400 }
        );
      }
    }

    const result = await sql`
      UPDATE blog_posts
      SET
        title = COALESCE(${title}, title),
        topic = COALESCE(${topic}, topic),
        author = COALESCE(${author}, author),
        publish_date = COALESCE(${publish_date}, publish_date),
        link = COALESCE(${link}, link),
        status = COALESCE(${status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `;

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
