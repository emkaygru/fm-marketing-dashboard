import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export const dynamic = 'force-dynamic';

// GET - Fetch post analytics, optionally filtered by month
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const month = searchParams.get('month'); // e.g. "2026-02"
  const platform = searchParams.get('platform'); // 'instagram' | 'facebook' | null

  try {
    let result;

    if (month && platform) {
      const monthDate = `${month}-01`;
      result = await sql`
        SELECT * FROM post_analytics
        WHERE report_month = ${monthDate}
          AND platform = ${platform}
        ORDER BY publish_time DESC
      `;
    } else if (month) {
      const monthDate = `${month}-01`;
      result = await sql`
        SELECT * FROM post_analytics
        WHERE report_month = ${monthDate}
        ORDER BY publish_time DESC
      `;
    } else if (platform) {
      result = await sql`
        SELECT * FROM post_analytics
        WHERE platform = ${platform}
        ORDER BY publish_time DESC
        LIMIT 200
      `;
    } else {
      result = await sql`
        SELECT * FROM post_analytics
        ORDER BY publish_time DESC
        LIMIT 200
      `;
    }

    // Get distinct months for the filter dropdown
    const months = await sql`
      SELECT DISTINCT TO_CHAR(report_month, 'YYYY-MM') AS month
      FROM post_analytics
      ORDER BY month DESC
    `;

    return NextResponse.json({
      posts: result.rows,
      months: months.rows.map((r: any) => r.month),
      total: result.rows.length,
    });
  } catch (error) {
    console.error('Error fetching post analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST - Bulk upsert parsed CSV rows
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows } = body as { rows: any[] };

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }

    let inserted = 0;
    let updated = 0;

    for (const row of rows) {
      try {
        const result = await sql`
          INSERT INTO post_analytics (
            post_id, platform, post_type, account_name, description,
            publish_time, permalink, report_month,
            views, reach, likes, comments_count, shares, saves, follows,
            reactions, total_clicks, duration_sec, seconds_viewed, avg_seconds_viewed
          ) VALUES (
            ${row.post_id}, ${row.platform}, ${row.post_type}, ${row.account_name},
            ${row.description}, ${row.publish_time}, ${row.permalink}, ${row.report_month},
            ${row.views || 0}, ${row.reach || 0}, ${row.likes || 0}, ${row.comments_count || 0},
            ${row.shares || 0}, ${row.saves || 0}, ${row.follows || 0},
            ${row.reactions || 0}, ${row.total_clicks || 0}, ${row.duration_sec || 0},
            ${row.seconds_viewed || 0}, ${row.avg_seconds_viewed || 0}
          )
          ON CONFLICT (post_id, platform) DO UPDATE SET
            views              = EXCLUDED.views,
            reach              = EXCLUDED.reach,
            likes              = EXCLUDED.likes,
            comments_count     = EXCLUDED.comments_count,
            shares             = EXCLUDED.shares,
            saves              = EXCLUDED.saves,
            follows            = EXCLUDED.follows,
            reactions          = EXCLUDED.reactions,
            total_clicks       = EXCLUDED.total_clicks,
            duration_sec       = EXCLUDED.duration_sec,
            seconds_viewed     = EXCLUDED.seconds_viewed,
            avg_seconds_viewed = EXCLUDED.avg_seconds_viewed,
            description        = EXCLUDED.description,
            imported_at        = CURRENT_TIMESTAMP
          RETURNING (xmax = 0) AS was_inserted
        `;
        if (result.rows[0]?.was_inserted) { inserted++; } else { updated++; }
      } catch (rowError) {
        console.warn('Skipping row due to error:', rowError);
      }
    }

    return NextResponse.json({
      message: `Import complete: ${inserted} new, ${updated} updated`,
      inserted,
      updated,
    });
  } catch (error) {
    console.error('Error importing post analytics:', error);
    return NextResponse.json(
      { error: 'Failed to import analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
