import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import { startOfWeek, addWeeks, format } from 'date-fns';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

// GET - Fetch content tracker overview (auto-populates from other tables)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const weeksParam = searchParams.get('weeks');
    const weeks = weeksParam ? parseInt(weeksParam) : 8; // Default to 8 weeks

    // Generate week_of dates (Mondays)
    const weekDates: string[] = [];
    for (let i = 0; i < weeks; i++) {
      const monday = startOfWeek(addWeeks(new Date(), i), { weekStartsOn: 1 });
      weekDates.push(format(monday, 'yyyy-MM-dd'));
    }

    const trackerData = [];

    for (const weekOf of weekDates) {
      // Get blog post for previous week (blogs publish Wednesday, so they're for "last week")
      const prevWeekMonday = format(
        addWeeks(new Date(weekOf), -1),
        'yyyy-MM-dd'
      );

      const blogResult = await sql`
        SELECT id, title, link, status, author, publish_date
        FROM blog_posts
        WHERE publish_date >= ${prevWeekMonday}
        AND publish_date < ${weekOf}
        ORDER BY publish_date DESC
        LIMIT 1
      `;

      // Get Beth's LinkedIn content for this week
      const bethLinkedinResult = await sql`
        SELECT COUNT(*) as count,
               SUM(CASE WHEN status IN ('scheduled', 'posted') THEN 1 ELSE 0 END) as posted_count
        FROM social_content
        WHERE week_of = ${weekOf}
        AND platform = 'LinkedIn'
        AND assigned_to = 'Beth'
      `;

      // Get social media content for this week
      const socialResult = await sql`
        SELECT COUNT(*) as total_count,
               SUM(CASE WHEN status = 'posted' THEN 1 ELSE 0 END) as posted_count,
               SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
               SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
               SUM(CASE WHEN status = 'ready_for_approval' THEN 1 ELSE 0 END) as ready_count,
               SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_count
        FROM social_content
        WHERE week_of = ${weekOf}
        AND platform IN ('Instagram', 'Facebook')
      `;

      const blogPost = blogResult.rows[0] || null;
      const bethLinkedin = bethLinkedinResult.rows[0];
      const social = socialResult.rows[0];

      trackerData.push({
        week_of: weekOf,
        blog_post: blogPost,
        beth_linkedin: {
          count: parseInt(bethLinkedin?.count || '0'),
          posted_count: parseInt(bethLinkedin?.posted_count || '0'),
          status: parseInt(bethLinkedin?.posted_count || '0') > 0 ? 'posted' :
                  parseInt(bethLinkedin?.count || '0') > 0 ? 'planned' : 'none'
        },
        social_media: {
          total: parseInt(social?.total_count || '0'),
          posted: parseInt(social?.posted_count || '0'),
          scheduled: parseInt(social?.scheduled_count || '0'),
          approved: parseInt(social?.approved_count || '0'),
          ready: parseInt(social?.ready_count || '0'),
          draft: parseInt(social?.draft_count || '0'),
          status: parseInt(social?.posted_count || '0') > 0 ? 'posted' :
                  parseInt(social?.scheduled_count || '0') > 0 ? 'scheduled' :
                  parseInt(social?.approved_count || '0') > 0 ? 'approved' :
                  parseInt(social?.ready_count || '0') > 0 ? 'ready' :
                  parseInt(social?.draft_count || '0') > 0 ? 'draft' : 'none'
        }
      });
    }

    return NextResponse.json({ tracker: trackerData });
  } catch (error) {
    console.error('Error fetching content tracker:', error);
    return NextResponse.json(
      { error: 'Failed to fetch content tracker', details: error },
      { status: 500 }
    );
  }
}
