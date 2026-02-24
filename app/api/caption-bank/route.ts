import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!accessToken || !pageId) {
    return NextResponse.json({ error: 'Missing Facebook/Meta credentials' }, { status: 500 });
  }

  const captions: any[] = [];

  // ── Facebook posts ────────────────────────────────────────────────────────
  try {
    let url = `https://graph.facebook.com/v19.0/${pageId}/posts?fields=message,created_time,permalink_url,likes.summary(true)&limit=100&access_token=${accessToken}`;

    // Page through all results (up to 500 posts)
    let pageCount = 0;
    while (url && pageCount < 5) {
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        console.error('Facebook caption-bank error:', data.error);
        break;
      }

      for (const post of data.data || []) {
        if (post.message) {
          captions.push({
            platform: 'Facebook',
            text: post.message,
            date: post.created_time ? post.created_time.split('T')[0] : '',
            media_type: 'Post',
            permalink: post.permalink_url || null,
            likes: post.likes?.summary?.total_count || 0,
          });
        }
      }

      url = data.paging?.next || null;
      pageCount++;
    }
  } catch (err) {
    console.error('Failed to fetch Facebook captions:', err);
  }

  // ── Instagram posts ───────────────────────────────────────────────────────
  try {
    // Step 1: Get the Instagram Business Account ID connected to the FB Page
    const pageRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
    );
    const pageData = await pageRes.json();
    const igAccountId = pageData.instagram_business_account?.id;

    if (igAccountId) {
      let igUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media?fields=caption,media_type,timestamp,permalink,like_count&limit=100&access_token=${accessToken}`;

      let pageCount = 0;
      while (igUrl && pageCount < 5) {
        const res = await fetch(igUrl);
        const data = await res.json();

        if (data.error) {
          console.error('Instagram caption-bank error:', data.error);
          break;
        }

        for (const post of data.data || []) {
          if (post.caption) {
            captions.push({
              platform: 'Instagram',
              text: post.caption,
              date: post.timestamp ? post.timestamp.split('T')[0] : '',
              media_type: post.media_type || 'POST',
              permalink: post.permalink || null,
              likes: post.like_count || 0,
            });
          }
        }

        igUrl = data.paging?.next || null;
        pageCount++;
      }
    }
  } catch (err) {
    console.error('Failed to fetch Instagram captions:', err);
  }

  // Sort newest first
  captions.sort((a, b) => (b.date > a.date ? 1 : -1));

  return NextResponse.json({ captions, count: captions.length });
}
