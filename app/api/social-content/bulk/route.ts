import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn'];
const CONTENT_TYPES = ['Post', 'Carousel', 'Reel', 'Story'];
const STATUSES = ['draft', 'paused', 'ready_for_approval', 'needs_edits', 'approved', 'scheduled', 'posted'];

interface BulkPost {
  post_date: string;
  platforms?: string[];
  platform?: string;
  content_type?: string;
  content_needs?: string;
  caption?: string;
  asset_link?: string;
  status?: string;
  assigned_to?: string;
  created_by?: string;
}

// POST - Insert many posts at once. Insert-only: never updates or replaces existing
// content, so a day that already has a post simply gets another one.
// Each row with several platforms becomes one thread (one post per platform).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const posts: BulkPost[] = Array.isArray(body) ? body : body.posts;

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'posts array is required' }, { status: 400 });
    }
    if (posts.length > 200) {
      return NextResponse.json({ error: 'Maximum 200 rows per import' }, { status: 400 });
    }

    // Validate everything before inserting anything
    const errors: string[] = [];
    posts.forEach((p, i) => {
      const row = i + 1;
      if (!p.post_date || !/^\d{4}-\d{2}-\d{2}$/.test(p.post_date)) errors.push(`Row ${row}: post_date must be YYYY-MM-DD`);
      const platforms = p.platforms ?? (p.platform ? [p.platform] : ['Instagram']);
      if (platforms.length === 0) errors.push(`Row ${row}: at least one platform is required`);
      platforms.forEach((pl) => {
        if (!PLATFORMS.includes(pl)) errors.push(`Row ${row}: unknown platform "${pl}"`);
      });
      if (p.content_type && !CONTENT_TYPES.includes(p.content_type)) errors.push(`Row ${row}: unknown content type "${p.content_type}"`);
      if (p.status && !STATUSES.includes(p.status)) errors.push(`Row ${row}: unknown status "${p.status}"`);
    });
    if (errors.length > 0) {
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 400 });
    }

    const created: any[] = [];
    for (const p of posts) {
      const platforms = p.platforms ?? (p.platform ? [p.platform] : ['Instagram']);
      let threadId: number | null = null;

      for (const platform of platforms) {
        const result: { rows: any[] } = await sql`
          INSERT INTO social_content (
            post_date, week_of, content_type, platform, content_needs,
            asset_link, caption, status, assigned_to, created_by, thread_id
          )
          VALUES (
            ${p.post_date},
            date_trunc('week', ${p.post_date}::date)::date,
            ${p.content_type || 'Post'}, ${platform}, ${p.content_needs ?? null},
            ${p.asset_link ?? null}, ${p.caption ?? null}, ${p.status || 'draft'},
            ${p.assigned_to || 'Emily'}, ${p.created_by || 'Emily'}, ${threadId}
          )
          RETURNING id, post_date, platform, content_type
        `;
        const row: any = result.rows[0];
        if (threadId === null) {
          threadId = row.id;
          await sql`UPDATE social_content SET thread_id = ${row.id} WHERE id = ${row.id}`;
        }
        created.push(row);
      }
    }

    return NextResponse.json({
      message: `Created ${created.length} posts`,
      count: created.length,
      ids: created.map((r) => r.id),
    }, { status: 201 });
  } catch (error) {
    console.error('Error bulk creating social content:', error);
    return NextResponse.json(
      { error: 'Failed to bulk create content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
