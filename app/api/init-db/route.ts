import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function GET(request: NextRequest) {
  try {
    // Create social_content table
    await sql`
      CREATE TABLE IF NOT EXISTS social_content (
        id BIGSERIAL PRIMARY KEY,
        post_date DATE NOT NULL,
        week_of DATE NOT NULL,
        content_type VARCHAR(20),
        platform VARCHAR(20),
        content_needs TEXT,
        asset_link TEXT,
        caption TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        assigned_to VARCHAR(100),
        created_by VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create content_comments table
    await sql`
      CREATE TABLE IF NOT EXISTS content_comments (
        id BIGSERIAL PRIMARY KEY,
        content_id BIGINT REFERENCES social_content(id) ON DELETE CASCADE,
        author_name VARCHAR(100),
        comment_text TEXT NOT NULL,
        resolved BOOLEAN DEFAULT FALSE,
        parent_comment_id BIGINT REFERENCES content_comments(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create blog_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id BIGSERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        topic VARCHAR(255),
        author VARCHAR(100),
        publish_date DATE NOT NULL,
        link TEXT,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create content_tracker table
    await sql`
      CREATE TABLE IF NOT EXISTS content_tracker (
        id BIGSERIAL PRIMARY KEY,
        week_of DATE NOT NULL UNIQUE,
        blog_post_id BIGINT REFERENCES blog_posts(id),
        blog_post_link TEXT,
        beth_linkedin_status VARCHAR(50),
        social_media_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_social_content_post_date ON social_content(post_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_social_content_week_of ON social_content(week_of)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_social_content_status ON social_content(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date ON blog_posts(publish_date)`;

    return NextResponse.json({
      message: 'Marketing Dashboard database tables created successfully',
      tables: [
        'social_content',
        'content_comments',
        'blog_posts',
        'content_tracker'
      ]
    });

  } catch (error) {
    console.error('Database initialization error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
