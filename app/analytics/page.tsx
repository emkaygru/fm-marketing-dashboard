'use client';

import { useState, useEffect } from 'react';
import MetricCard from '@/components/MetricCard';
import ChartCard from '@/components/ChartCard';
import { TrendingUp, Users, Mail, Eye, MousePointerClick, Heart } from 'lucide-react';
import CampaignAccordion from '@/components/CampaignAccordion';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [selectedGA4Property, setSelectedGA4Property] = useState('main');
  
  // State for all data sources
  const [ga4MainData, setGA4MainData] = useState<any>(null);
  const [ga4FunnelData, setGA4FunnelData] = useState<any>(null);
  const [ga4CheckoutData, setGA4CheckoutData] = useState<any>(null);
  const [instagramData, setInstagramData] = useState<any>(null);
  const [facebookData, setFacebookData] = useState<any>(null);
  const [newsletterData, setNewsletterData] = useState<any>(null);
  const [searchConsoleData, setSearchConsoleData] = useState<any>(null);


  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel - now including 3 GA4 properties
      const [main, funnel, checkout, instagram, facebook, newsletter, searchConsole] = await Promise.all([
        fetch(`/api/ga4?range=${dateRange}&property=main`).then(r => r.json()),
        fetch(`/api/ga4?range=${dateRange}&property=funnel`).then(r => r.json()),
        fetch(`/api/ga4?range=${dateRange}&property=checkout`).then(r => r.json()),
        fetch(`/api/instagram?range=${dateRange}`).then(r => r.json()),
        fetch(`/api/facebook?range=${dateRange}`).then(r => r.json()),
        fetch(`/api/ghl?range=${dateRange}`).then(r => r.json()),
        fetch(`/api/search-console?range=${dateRange}`).then(r => r.json()),
      ]);

      setGA4MainData(main);
      setGA4FunnelData(funnel);
      setGA4CheckoutData(checkout);
      setInstagramData(instagram);
      setFacebookData(facebook);
      setNewsletterData(newsletter);
      setSearchConsoleData(searchConsole);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-fm-blue"></div>
          <p className="mt-4 text-fm-gray">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">
                Website, social media, and marketing performance metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-fm-navy mb-6">Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Website Visitors"
              value={ga4MainData?.totalUsers || 0}
              change={ga4MainData?.userGrowth || 0}
              icon={<Eye className="w-5 h-5" />}
              color="blue"
            />
            <MetricCard
              title="Instagram Followers"
              value={`${instagramData?.followers?.toLocaleString() || 0}`}
              change={instagramData?.followerGrowth || 0}
              icon={<Users className="w-5 h-5" />}
              color="orange"
              subtitle={instagramData?.newFollowers ? `+${instagramData.newFollowers} new` : undefined}
            />
            <MetricCard
              title="Email Subscribers"
              value={newsletterData?.subscribers?.toLocaleString() || 0}
              change={newsletterData?.subscriberGrowth || 0}
              icon={<Mail className="w-5 h-5" />}
              color="teal"
              subtitle={newsletterData?.newSubscribers ? `+${newsletterData.newSubscribers} new` : undefined}
            />
            <MetricCard
              title="Facebook Followers"
              value={facebookData?.followers?.toLocaleString() || 0}
              change={facebookData?.followerGrowth || 0}
              icon={<Users className="w-5 h-5" />}
              color="navy"
              subtitle={facebookData?.newFollowers ? `+${facebookData.newFollowers} new` : undefined}
            />
          </div>
        </section>

        {/* Website Performance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-fm-navy mb-6">Website Performance</h2>
          
          {/* Property Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <button
              onClick={() => setSelectedGA4Property('main')}
              className={`text-left p-6 rounded-lg border-2 transition ${
                selectedGA4Property === 'main' 
                  ? 'border-fm-blue bg-fm-blue bg-opacity-5 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm text-fm-gray mb-2">Main Site</div>
              <div className="text-3xl font-bold text-fm-navy">
                {ga4MainData?.totalUsers?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm mt-2 ${ga4MainData?.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ga4MainData?.userGrowth >= 0 ? '↑' : '↓'} {Math.abs(ga4MainData?.userGrowth || 0)}% visitors
              </div>
            </button>

            <button
              onClick={() => setSelectedGA4Property('funnel')}
              className={`text-left p-6 rounded-lg border-2 transition ${
                selectedGA4Property === 'funnel' 
                  ? 'border-fm-orange bg-fm-orange bg-opacity-5 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm text-fm-gray mb-2">ELM Funnel</div>
              <div className="text-3xl font-bold text-fm-navy">
                {ga4FunnelData?.totalUsers?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm mt-2 ${ga4FunnelData?.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ga4FunnelData?.userGrowth >= 0 ? '↑' : '↓'} {Math.abs(ga4FunnelData?.userGrowth || 0)}% visitors
              </div>
            </button>

            <button
              onClick={() => setSelectedGA4Property('checkout')}
              className={`text-left p-6 rounded-lg border-2 transition ${
                selectedGA4Property === 'checkout' 
                  ? 'border-fm-teal bg-fm-teal bg-opacity-5 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-sm text-fm-gray mb-2">ELM Checkout</div>
              <div className="text-3xl font-bold text-fm-navy">
                {ga4CheckoutData?.totalUsers?.toLocaleString() || '0'}
              </div>
              <div className={`text-sm mt-2 ${ga4CheckoutData?.userGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {ga4CheckoutData?.userGrowth >= 0 ? '↑' : '↓'} {Math.abs(ga4CheckoutData?.userGrowth || 0)}% visitors
              </div>
            </button>
          </div>

          {/* Charts for Selected Property */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title={`${
                selectedGA4Property === 'main' ? 'Main Site' : 
                selectedGA4Property === 'funnel' ? 'ELM Funnel' : 
                'ELM Checkout'
              } Traffic`}
              subtitle="Daily visitors over time"
              data={
                selectedGA4Property === 'main' ? ga4MainData?.trafficData || [] :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.trafficData || [] :
                ga4CheckoutData?.trafficData || []
              }
              dataKey="users"
              color="#00639e"
            />
            <ChartCard
              title="Traffic Sources"
              subtitle="Where visitors come from"
              data={
                selectedGA4Property === 'main' ? ga4MainData?.sourceData || [] :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.sourceData || [] :
                ga4CheckoutData?.sourceData || []
              }
              dataKey="sessions"
              color="#e45525"
              chartType="bar"
            />
          </div>
          
          {/* Metrics for Selected Property */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <MetricCard
              title="Page Views"
              value={
                selectedGA4Property === 'main' ? ga4MainData?.pageViews || 0 :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.pageViews || 0 :
                ga4CheckoutData?.pageViews || 0
              }
              change={
                selectedGA4Property === 'main' ? ga4MainData?.pageViewGrowth || 0 :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.pageViewGrowth || 0 :
                ga4CheckoutData?.pageViewGrowth || 0
              }
              icon={<MousePointerClick className="w-5 h-5" />}
              color="blue"
              compact
            />
            <MetricCard
              title="Avg. Session Duration"
              value={
                selectedGA4Property === 'main' ? ga4MainData?.avgDuration || '0:00' :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.avgDuration || '0:00' :
                ga4CheckoutData?.avgDuration || '0:00'
              }
              change={
                selectedGA4Property === 'main' ? ga4MainData?.durationGrowth || 0 :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.durationGrowth || 0 :
                ga4CheckoutData?.durationGrowth || 0
              }
              icon={<TrendingUp className="w-5 h-5" />}
              color="orange"
              compact
              isTime
            />
            <MetricCard
              title="Bounce Rate"
              value={`${
                selectedGA4Property === 'main' ? ga4MainData?.bounceRate || 0 :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.bounceRate || 0 :
                ga4CheckoutData?.bounceRate || 0
              }%`}
              change={
                selectedGA4Property === 'main' ? ga4MainData?.bounceRateChange || 0 :
                selectedGA4Property === 'funnel' ? ga4FunnelData?.bounceRateChange || 0 :
                ga4CheckoutData?.bounceRateChange || 0
              }
              icon={<Eye className="w-5 h-5" />}
              color="teal"
              compact
              inverse
            />
          </div>
        </section>

        {/* Search Console */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-fm-navy mb-6">Google Search Console</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Search Impressions"
              subtitle="How often you appear in search"
              data={searchConsoleData?.impressionsData || []}
              dataKey="impressions"
              color="#2fb7c8"
            />
            <ChartCard
              title="Click-Through Rate"
              subtitle="Search clicks vs impressions"
              data={searchConsoleData?.ctrData || []}
              dataKey="ctr"
              color="#f7d878"
            />
          </div>
        </section>

        {/* Social Media */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-fm-navy mb-6">Social Media</h2>
          
          {/* Instagram */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-fm-gray mb-4">Instagram</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Instagram Engagement"
                subtitle="Likes, comments, shares"
                data={instagramData?.engagementData || []}
                dataKey="engagement"
                color="#e45525"
              />
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Posts"
                  value={instagramData?.totalPosts || 0}
                  change={instagramData?.postGrowth || 0}
                  icon={<Heart className="w-5 h-5" />}
                  color="orange"
                  compact
                />
                <MetricCard
                  title="Engagement Rate"
                  value={`${instagramData?.engagementRate || 0}%`}
                  change={instagramData?.engagementRateChange || 0}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="orange"
                  compact
                />
                <MetricCard
                  title="Reach"
                  value={instagramData?.reach || 0}
                  change={instagramData?.reachGrowth || 0}
                  icon={<Eye className="w-5 h-5" />}
                  color="orange"
                  compact
                />
                <MetricCard
                  title="Impressions"
                  value={instagramData?.impressions || 0}
                  change={instagramData?.impressionGrowth || 0}
                  icon={<MousePointerClick className="w-5 h-5" />}
                  color="orange"
                  compact
                />
              </div>
            </div>
          </div>

          {/* Facebook */}
          <div>
            <h3 className="text-xl font-semibold text-fm-gray mb-4">Facebook</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Facebook Engagement"
                subtitle="Likes, comments, shares"
                data={facebookData?.engagementData || []}
                dataKey="engagement"
                color="#1d3665"
              />
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  title="Page Likes"
                  value={facebookData?.pageLikes || 0}
                  change={facebookData?.pageLikeGrowth || 0}
                  icon={<Heart className="w-5 h-5" />}
                  color="navy"
                  compact
                />
                <MetricCard
                  title="Post Reach"
                  value={facebookData?.reach || 0}
                  change={facebookData?.reachGrowth || 0}
                  icon={<Eye className="w-5 h-5" />}
                  color="navy"
                  compact
                />
                <MetricCard
                  title="Engagement Rate"
                  value={`${facebookData?.engagementRate || 0}%`}
                  change={facebookData?.engagementRateChange || 0}
                  icon={<TrendingUp className="w-5 h-5" />}
                  color="navy"
                  compact
                />
                <MetricCard
                  title="Video Views"
                  value={facebookData?.videoViews || 0}
                  change={facebookData?.videoViewGrowth || 0}
                  icon={<MousePointerClick className="w-5 h-5" />}
                  color="navy"
                  compact
                />
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Performance */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-fm-navy mb-6">Newsletter Performance (GHL)</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <ChartCard
              title="Subscriber Growth"
              subtitle="New subscribers over time"
              data={newsletterData?.growthData || []}
              dataKey="subscribers"
              color="#2fb7c8"
            />
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                title="Open Rate"
                value={`${newsletterData?.openRate || 0}%`}
                change={newsletterData?.openRateChange || 0}
                icon={<Mail className="w-5 h-5" />}
                color="teal"
                compact
              />
              <MetricCard
                title="Click Rate"
                value={`${newsletterData?.clickRate || 0}%`}
                change={newsletterData?.clickRateChange || 0}
                icon={<MousePointerClick className="w-5 h-5" />}
                color="teal"
                compact
              />
              <MetricCard
                title="Unsubscribes"
                value={newsletterData?.unsubscribes || 0}
                change={newsletterData?.unsubscribeChange || 0}
                icon={<Users className="w-5 h-5" />}
                color="teal"
                compact
                inverse
              />
              <MetricCard
                title="Campaigns Sent"
                value={newsletterData?.campaignsSent || 0}
                change={newsletterData?.campaignGrowth || 0}
                icon={<TrendingUp className="w-5 h-5" />}
                color="teal"
                compact
              />
            </div>
          </div>

          {/* Recent Campaigns Accordion */}
          <CampaignAccordion campaigns={newsletterData?.recentCampaigns || []} />

          {/* Active Contact Tags */}
          <div className="mt-6 p-6 bg-white rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-fm-navy mb-4">📊 Active Contact Tags (This Week)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {newsletterData?.activeTags?.map((tag: any, index: number) => (
                <div key={index} className="p-3 bg-fm-teal bg-opacity-5 rounded-lg border border-fm-teal border-opacity-20">
                  <div className="text-xs text-fm-gray mb-1">{tag.name}</div>
                  <div className="text-2xl font-bold text-fm-navy">{tag.count}</div>
                  <div className="text-xs text-fm-teal mt-1">+{tag.recentActivity} this week</div>
                </div>
              )) || (
                <div className="col-span-full text-center py-4 text-fm-gray">No active tags this week</div>
              )}
            </div>
          </div>
        </section>

        
      </main>
    </div>
  );
}
