import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Diagnostic endpoint — returns raw Meta API responses so we can see exactly
// what fields are coming back and why captions might be empty.
export async function GET() {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID || process.env.META_PAGE_ID;

  if (!accessToken || !pageId) {
    return NextResponse.json({
      error: 'Missing credentials',
      found: {
        META_ACCESS_TOKEN: !!process.env.META_ACCESS_TOKEN,
        FACEBOOK_ACCESS_TOKEN: !!process.env.FACEBOOK_ACCESS_TOKEN,
        FACEBOOK_PAGE_ID: !!process.env.FACEBOOK_PAGE_ID,
        META_PAGE_ID: !!process.env.META_PAGE_ID,
      },
    }, { status: 500 });
  }

  const result: any = {
    credentials: { pageId, tokenLength: accessToken.length },
    facebook: null,
    instagram_account_id: null,
    instagram: null,
  };

  // Check Facebook posts (first 5 only)
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}/posts?fields=message,story,created_time,permalink_url,attachments&limit=5&access_token=${accessToken}`
    );
    const data = await res.json();
    result.facebook = {
      error: data.error || null,
      total_returned: data.data?.length || 0,
      posts_with_message: data.data?.filter((p: any) => p.message).length || 0,
      sample: data.data?.slice(0, 3).map((p: any) => ({
        has_message: !!p.message,
        has_story: !!p.story,
        message_preview: p.message ? p.message.slice(0, 80) + '...' : null,
        created_time: p.created_time,
      })) || [],
    };
  } catch (err: any) {
    result.facebook = { fetch_error: err.message };
  }

  // Check Instagram business account link
  try {
    const pageRes = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account,name&access_token=${accessToken}`
    );
    const pageData = await pageRes.json();
    result.instagram_account_id = pageData.instagram_business_account?.id || null;
    result.facebook_page_name = pageData.name || null;
    result.instagram_link_error = pageData.error || null;
  } catch (err: any) {
    result.instagram_account_id = null;
    result.instagram_link_error = err.message;
  }

  // Check Instagram media (first 5 only)
  if (result.instagram_account_id) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${result.instagram_account_id}/media?fields=caption,media_type,timestamp,permalink&limit=5&access_token=${accessToken}`
      );
      const data = await res.json();
      result.instagram = {
        error: data.error || null,
        total_returned: data.data?.length || 0,
        posts_with_caption: data.data?.filter((p: any) => p.caption).length || 0,
        sample: data.data?.slice(0, 3).map((p: any) => ({
          has_caption: !!p.caption,
          media_type: p.media_type,
          caption_preview: p.caption ? p.caption.slice(0, 80) + '...' : null,
          timestamp: p.timestamp,
        })) || [],
      };
    } catch (err: any) {
      result.instagram = { fetch_error: err.message };
    }
  }

  return NextResponse.json(result, { status: 200 });
}
