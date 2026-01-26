import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '30d';
  const property = searchParams.get('property') || 'main'; // main, funnel, or checkout
  
  const daysAgo = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

  // Select which property ID to use (supports both naming conventions)
  const propertyIds: Record<string, string> = {
    main: process.env.GA4_PROPERTY_ID_MAIN || process.env.GA4_MAIN_PROPERTY_ID || '',
    funnel: process.env.GA4_PROPERTY_ID_FUNNEL || process.env.GA4_FUNNEL_PROPERTY_ID || '',
    checkout: process.env.GA4_PROPERTY_ID_CHECKOUT || process.env.GA4_CHECKOUT_PROPERTY_ID || '',
  };

  const propertyId = propertyIds[property];

  if (!propertyId) {
    return NextResponse.json({ error: `Property ${property} not configured` }, { status: 400 });
  }

  // Support both GA4_CREDENTIALS (JSON) and separate GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY
  let credentials;
  try {
    if (process.env.GA4_CREDENTIALS) {
      console.log('Using GA4_CREDENTIALS, length:', process.env.GA4_CREDENTIALS.length);
      console.log('First 50 chars:', process.env.GA4_CREDENTIALS.substring(0, 50));
      credentials = JSON.parse(process.env.GA4_CREDENTIALS);
      console.log('Parsed credentials, has private_key:', !!credentials.private_key);
      console.log('private_key length:', credentials.private_key?.length);
      console.log('private_key starts with:', credentials.private_key?.substring(0, 30));
    } else if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      // Handle different private key formats
      let privateKey = process.env.GOOGLE_PRIVATE_KEY;

      // If the key doesn't start with -----BEGIN PRIVATE KEY-----, add it
      if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
      }

      // Replace escaped newlines with actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n');

      credentials = {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: privateKey,
        type: 'service_account',
      };
    } else {
      return NextResponse.json({
        error: 'Google Analytics credentials not configured',
        debug: {
          hasGA4Credentials: !!process.env.GA4_CREDENTIALS,
          hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          hasKey: !!process.env.GOOGLE_PRIVATE_KEY,
        }
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse Google Analytics credentials',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  const analyticsDataClient = new BetaAnalyticsDataClient({
    credentials,
  });

  try {
    const [response] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [
        { startDate: `${daysAgo}daysAgo`, endDate: 'today' },
        { startDate: `${daysAgo * 2}daysAgo`, endDate: `${daysAgo}daysAgo` },
      ],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    const [sourceResponse] = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: `${daysAgo}daysAgo`, endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }],
    });

    const rows = response.rows || [];
    const midpoint = Math.floor(rows.length / 2);
    const currentPeriod = rows.slice(0, midpoint);
    const previousPeriod = rows.slice(midpoint);

    const totalUsers = currentPeriod.reduce((sum, row) => 
      sum + parseInt(row.metricValues?.[0]?.value || '0'), 0);
    const prevTotalUsers = previousPeriod.reduce((sum, row) => 
      sum + parseInt(row.metricValues?.[0]?.value || '0'), 0);
    const userGrowth = prevTotalUsers > 0 
      ? ((totalUsers - prevTotalUsers) / prevTotalUsers * 100).toFixed(1)
      : 0;

    const totalPageViews = currentPeriod.reduce((sum, row) =>
      sum + parseInt(row.metricValues?.[1]?.value || '0'), 0);
    const prevPageViews = previousPeriod.reduce((sum, row) =>
      sum + parseInt(row.metricValues?.[1]?.value || '0'), 0);
    const pageViewGrowth = prevPageViews > 0
      ? ((totalPageViews - prevPageViews) / prevPageViews * 100).toFixed(1)
      : 0;

    // Calculate average session duration
    const totalDuration = currentPeriod.reduce((sum, row) =>
      sum + parseFloat(row.metricValues?.[2]?.value || '0'), 0);
    const avgSessionDuration = totalDuration / currentPeriod.length;
    const prevTotalDuration = previousPeriod.reduce((sum, row) =>
      sum + parseFloat(row.metricValues?.[2]?.value || '0'), 0);
    const prevAvgDuration = prevTotalDuration / previousPeriod.length;
    const durationGrowth = prevAvgDuration > 0
      ? ((avgSessionDuration - prevAvgDuration) / prevAvgDuration * 100).toFixed(1)
      : 0;

    // Calculate bounce rate
    const totalBounceRate = currentPeriod.reduce((sum, row) =>
      sum + parseFloat(row.metricValues?.[3]?.value || '0'), 0);
    const avgBounceRate = (totalBounceRate / currentPeriod.length * 100);
    const prevTotalBounceRate = previousPeriod.reduce((sum, row) =>
      sum + parseFloat(row.metricValues?.[3]?.value || '0'), 0);
    const prevAvgBounceRate = (prevTotalBounceRate / previousPeriod.length * 100);
    const bounceRateChange = prevAvgBounceRate > 0
      ? ((avgBounceRate - prevAvgBounceRate) / prevAvgBounceRate * 100).toFixed(1)
      : 0;

    // Format session duration as MM:SS
    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return NextResponse.json({
      totalUsers,
      userGrowth: parseFloat(userGrowth as string),
      pageViews: totalPageViews,
      pageViewGrowth: parseFloat(pageViewGrowth as string),
      avgDuration: formatDuration(avgSessionDuration),
      durationGrowth: parseFloat(durationGrowth as string),
      bounceRate: parseFloat(avgBounceRate.toFixed(1)),
      bounceRateChange: parseFloat(bounceRateChange as string),
      trafficData: currentPeriod.map(row => ({
        date: formatDate(row.dimensionValues?.[0]?.value || ''),
        users: parseInt(row.metricValues?.[0]?.value || '0'),
      })),
      sourceData: sourceResponse.rows?.map(row => ({
        name: row.dimensionValues?.[0]?.value || 'Unknown',
        sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      })) || [],
    });
  } catch (error) {
    console.error(`GA4 API Error (${property}):`, error);
    return NextResponse.json({ 
      error: 'Failed to fetch GA4 data',
      details: error instanceof Error ? error.message : 'Unknown error',
      property
    }, { status: 500 });
  }
}

function formatDate(dateString: string) {
  const year = dateString.substring(0, 4);
  const month = dateString.substring(4, 6);
  const day = dateString.substring(6, 8);
  return new Date(`${year}-${month}-${day}`).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
}
