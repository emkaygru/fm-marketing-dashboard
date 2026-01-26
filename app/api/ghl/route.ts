import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

// This is a mock implementation. Replace with actual GoHighLevel API calls
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const range = searchParams.get('range') || '30d';
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;

  // TODO: Replace with actual GoHighLevel API integration

  // Get recent campaigns from database (last 3)
  let recentCampaigns: any[] = [];
  try {
    const result = await sql`
      SELECT id, name, send_date as "sendDate", delivered, opened, clicked, raw_opens, raw_clicks
      FROM campaigns
      ORDER BY send_date DESC
      LIMIT 3
    `;

    recentCampaigns = result.rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      sentDate: c.sendDate,
      recipients: c.delivered,
      opens: c.raw_opens || Math.floor(c.delivered * c.opened / 100),
      clicks: c.raw_clicks || Math.floor(c.delivered * c.clicked / 100),
      openRate: c.opened,
      clickRate: c.clicked,
    }));
  } catch (error) {
    console.error('Error fetching campaigns from database:', error);
    // Fallback to empty if database fails
    recentCampaigns = [];
  }

  // Mock active tags (tags used/updated in the last 7 days)
  const activeTags = [
    { name: 'Newsletter Subscribers', count: 636, recentActivity: 12 },
    { name: 'Engaged', count: 81, recentActivity: 8 },
    { name: 'ELM Interest', count: 45, recentActivity: 15 },
    { name: 'Substack', count: 205, recentActivity: 5 },
    { name: 'Course Purchasers', count: 34, recentActivity: 7 },
  ];

  // Try to fetch real GHL data
  let totalContacts = 0;
  let ghlError = null;

  const ghlApiKey = process.env.GHL_API_KEY;
  const ghlLocationId = process.env.GHL_LOCATION_ID;

  if (ghlApiKey && ghlLocationId) {
    try {
      // Correct GoHighLevel API v2 endpoint
      const ghlResponse = await fetch(
        `https://services.leadconnectorhq.com/contacts/?locationId=${ghlLocationId}`,
        {
          headers: {
            'Authorization': `Bearer ${ghlApiKey}`,
            'Version': '2021-07-28',
            'Content-Type': 'application/json'
          }
        }
      );

      const ghlData = await ghlResponse.json();
      console.log('GHL API Response meta:', JSON.stringify(ghlData.meta, null, 2));

      // GHL API returns total in meta.total field
      if (ghlData.meta && ghlData.meta.total) {
        totalContacts = ghlData.meta.total;
      } else if (ghlData.total) {
        totalContacts = ghlData.total;
      } else if (ghlData.contacts) {
        totalContacts = ghlData.contacts.length;
      }
    } catch (error) {
      console.error('GHL API Error:', error);
      ghlError = error instanceof Error ? error.message : 'Unknown error';
    }
  }

  // Use real contact count if available, otherwise use fallback
  const baseSubscribers = 3456;
  const subscribers = totalContacts > 0 ? totalContacts : baseSubscribers;
  const newSubscribers = Math.floor(Math.random() * (days * 5)) + days * 2;

  const mockData = {
    subscribers: subscribers,
    newSubscribers: newSubscribers, // New in this period
    subscriberGrowth: ((newSubscribers / subscribers) * 100).toFixed(1),
    openRate: 24.6,
    openRateChange: 2.3,
    clickRate: 3.8,
    clickRateChange: 0.5,
    unsubscribes: Math.floor(Math.random() * days) + 5,
    unsubscribeChange: parseFloat((Math.random() * 20 - 10).toFixed(1)),
    campaignsSent: Math.floor(days / 7) + 1, // Roughly 1 per week
    campaignGrowth: 20.0,
    growthData: generateMockTimeSeriesData(range, 'subscribers'),
    recentCampaigns: recentCampaigns.slice(0, 3),
    activeTags: activeTags,
    debug: {
      ghlConnected: !!ghlApiKey,
      totalContactsFromGHL: totalContacts,
      ghlError: ghlError
    }
  };

  return NextResponse.json(mockData);
}

function generateMockTimeSeriesData(range: string, dataKey: string) {
  const days = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
  const data = [];
  let total = 3000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    total += Math.floor(Math.random() * 20) - 5; // Random growth
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      [dataKey]: total,
    });
  }
  
  return data;
}

// API Integration Guide for GoHighLevel:
// 1. Get your GHL API Key from Settings → API
// 2. Documentation: https://highlevel.stoplight.io/
// 3. Base URL: https://rest.gohighlevel.com/v1/
// 
// Example for getting contacts (subscribers):
// const response = await fetch(
//   `https://rest.gohighlevel.com/v1/contacts/?locationId=${LOCATION_ID}`,
//   {
//     headers: {
//       'Authorization': `Bearer ${GHL_API_KEY}`,
//       'Content-Type': 'application/json',
//     }
//   }
// );
// 
// For campaign stats:
// const campaignResponse = await fetch(
//   `https://rest.gohighlevel.com/v1/campaigns/${CAMPAIGN_ID}/stats`,
//   {
//     headers: {
//       'Authorization': `Bearer ${GHL_API_KEY}`,
//     }
//   }
// );
// 
// Note: GHL API has rate limits (100 requests per minute)
