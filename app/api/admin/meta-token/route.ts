import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET — debug the current META_ACCESS_TOKEN
export async function GET() {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID || process.env.META_PAGE_ID;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  const result: any = {
    env: {
      hasToken: !!accessToken,
      hasPageId: !!pageId,
      hasAppId: !!appId,
      hasAppSecret: !!appSecret,
      tokenLength: accessToken?.length || 0,
      tokenPrefix: accessToken ? accessToken.slice(0, 12) + '...' : null,
    },
    pageCheck: null,
    debugToken: null,
  };

  if (!accessToken || !pageId) {
    return NextResponse.json(result);
  }

  // Test the token by hitting the page endpoint
  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pageId}?fields=name,instagram_business_account&access_token=${accessToken}`
    );
    const data = await res.json();
    result.pageCheck = {
      error: data.error || null,
      pageName: data.name || null,
      instagramAccountId: data.instagram_business_account?.id || null,
    };
  } catch (err: any) {
    result.pageCheck = { fetchError: err.message };
  }

  // If app credentials are available, run debug_token for full info
  if (appId && appSecret) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${appId}|${appSecret}`
      );
      const data = await res.json();
      const dt = data.data || {};
      result.debugToken = {
        error: data.error || null,
        isValid: dt.is_valid ?? null,
        type: dt.type || null,
        appId: dt.app_id || null,
        expiresAt: dt.expires_at
          ? new Date(dt.expires_at * 1000).toISOString()
          : dt.expires_at === 0
          ? 'Never (non-expiring token)'
          : null,
        expiresAtRaw: dt.expires_at ?? null,
        scopes: dt.scopes || [],
      };
    } catch (err: any) {
      result.debugToken = { fetchError: err.message };
    }
  }

  return NextResponse.json(result);
}

// POST { shortLivedToken } — exchange for a never-expiring page token
export async function POST(request: NextRequest) {
  const { shortLivedToken } = await request.json();
  const pageId = process.env.FACEBOOK_PAGE_ID || process.env.META_PAGE_ID;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: 'META_APP_ID and META_APP_SECRET must be set in Vercel env vars to exchange tokens' },
      { status: 400 }
    );
  }

  if (!pageId) {
    return NextResponse.json({ error: 'FACEBOOK_PAGE_ID must be set in Vercel env vars' }, { status: 400 });
  }

  if (!shortLivedToken?.trim()) {
    return NextResponse.json({ error: 'shortLivedToken is required' }, { status: 400 });
  }

  // Step 1: Exchange short-lived user token → long-lived user token (60 days)
  const longLivedRes = await fetch(
    `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken.trim()}`
  );
  const longLivedData = await longLivedRes.json();

  if (longLivedData.error) {
    return NextResponse.json(
      { error: 'Failed to exchange short-lived token', detail: longLivedData.error },
      { status: 400 }
    );
  }

  const longLivedUserToken = longLivedData.access_token;

  // Step 2: Get the Page access token — never expires when derived from a long-lived user token
  const pageTokenRes = await fetch(
    `https://graph.facebook.com/v19.0/${pageId}?fields=access_token,name&access_token=${longLivedUserToken}`
  );
  const pageTokenData = await pageTokenRes.json();

  if (pageTokenData.error) {
    return NextResponse.json({
      error: 'Got long-lived user token but failed to get Page token — check page permissions',
      longLivedUserToken,
      detail: pageTokenData.error,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    pageName: pageTokenData.name,
    pageToken: pageTokenData.access_token,
    note: 'This is a never-expiring Page access token. Set META_ACCESS_TOKEN in Vercel to this value, then redeploy.',
  });
}
