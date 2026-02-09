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

    // Create campaigns table for newsletter analytics
    await sql`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        send_date DATE NOT NULL,
        delivered INTEGER NOT NULL DEFAULT 0,
        opened DECIMAL(5,2) NOT NULL DEFAULT 0,
        clicked DECIMAL(5,2) NOT NULL DEFAULT 0,
        bounce INTEGER NOT NULL DEFAULT 0,
        unsubscribed INTEGER NOT NULL DEFAULT 0,
        spam INTEGER NOT NULL DEFAULT 0,
        raw_opens INTEGER,
        raw_clicks INTEGER,
        ab_subject_a TEXT,
        ab_subject_b TEXT,
        ab_winner VARCHAR(1),
        ab_opened_a DECIMAL(5,2),
        ab_opened_b DECIMAL(5,2),
        ab_clicked_a DECIMAL(5,2),
        ab_clicked_b DECIMAL(5,2),
        ab_opens_a INTEGER,
        ab_opens_b INTEGER,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert sample campaign data
    await sql`
      INSERT INTO campaigns (
        name, send_date, delivered, opened, clicked, bounce, unsubscribed, spam
      ) VALUES
        ('Mindset', '2026-01-07', 566, 8.48, 0.35, 4, 3, 0),
        ('Oops Substack', '2026-01-11', 205, 8.29, 0.49, 2, 0, 0)
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO campaigns (
        name, send_date, delivered, opened, clicked, bounce, unsubscribed, spam,
        ab_subject_a, ab_subject_b, ab_winner, ab_opened_a, ab_opened_b, ab_clicked_a, ab_clicked_b,
        notes
      ) VALUES (
        'Freedom Number A/B',
        '2026-01-15',
        636,
        8.49,
        0.16,
        0,
        1,
        0,
        'The Mistake That Nearly Killed Her Business Before It Even Launched',
        'Nine Months In—And She Had No Idea What Her Business Needed to Survive',
        'A',
        11,
        10,
        1,
        0,
        'Jan 19 email will include ONLY Newsletter subscribers who have interacted with the email the past 30 days, it will be a drastically smaller list. 81'
      )
      ON CONFLICT DO NOTHING
    `;

    await sql`
      INSERT INTO campaigns (
        name, send_date, delivered, opened, clicked, bounce, unsubscribed, spam, notes
      ) VALUES (
        'Pipeline',
        '2026-01-21',
        0,
        0,
        0,
        0,
        0,
        0,
        'Pending'
      )
      ON CONFLICT DO NOTHING
    `;

    // Create indexes for better performance
    await sql`CREATE INDEX IF NOT EXISTS idx_social_content_post_date ON social_content(post_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_social_content_week_of ON social_content(week_of)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_social_content_status ON social_content(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_content_comments_content_id ON content_comments(content_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_blog_posts_publish_date ON blog_posts(publish_date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_campaigns_send_date ON campaigns(send_date)`;

    return NextResponse.json({
      message: 'Marketing Dashboard database tables created successfully',
      tables: [
        'social_content',
        'content_comments',
        'blog_posts',
        'content_tracker',
        'campaigns'
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
