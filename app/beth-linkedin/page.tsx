'use client';

import { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';

interface LinkedInContent {
  id: number;
  post_date: string;
  week_of: string;
  content_type: string;
  content_needs: string;
  asset_link: string;
  caption: string;
  status: string;
  created_at: string;
}

export default function BethLinkedInPage() {
  const [content, setContent] = useState<LinkedInContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchContent();
  }, [weekOffset]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Get 4 weeks of LinkedIn content assigned to Beth
      const startDate = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const endDate = endOfWeek(addWeeks(startDate, 3), { weekStartsOn: 1 });

      const response = await fetch(
        `/api/social-content?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}&platform=LinkedIn`
      );
      const data = await response.json();

      // Filter for Beth's content
      const bethContent = (data.content || []).filter((item: any) => item.assigned_to === 'Beth');
      setContent(bethContent);
    } catch (error) {
      console.error('Error fetching LinkedIn content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkCreated = async (id: number) => {
    try {
      const response = await fetch('/api/social-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'scheduled' }),
      });

      if (response.ok) {
        await fetchContent();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'ready_for_approval':
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'scheduled':
      case 'posted':
        return 'bg-purple-200 text-purple-800';
      default:
        return 'bg-blue-200 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = startOfWeek(addWeeks(new Date(), weekOffset + i), { weekStartsOn: 1 });
    weeks.push(weekStart);
  }

  // Group content by week
  const contentByWeek: Record<string, LinkedInContent[]> = {};
  content.forEach((item) => {
    const weekKey = item.week_of.split('T')[0];
    if (!contentByWeek[weekKey]) {
      contentByWeek[weekKey] = [];
    }
    contentByWeek[weekKey].push(item);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading LinkedIn content...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Beth's LinkedIn Content</h1>
            <p className="mt-1 text-sm text-gray-500">
              Your assigned LinkedIn posts and content schedule
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setWeekOffset(weekOffset - 4)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous 4 Weeks
          </button>

          <div className="flex items-center gap-3">
            <div className="text-sm font-medium text-gray-700">
              {format(weeks[0], 'MMM d')} - {format(endOfWeek(weeks[3], { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </div>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-3 py-1.5 text-xs font-medium text-fm-blue bg-fm-blue/10 rounded-md hover:bg-fm-blue/20 transition-colors"
              >
                Today
              </button>
            )}
          </div>

          <button
            onClick={() => setWeekOffset(weekOffset + 4)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Next 4 Weeks
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Content Cards */}
        <div className="space-y-6">
          {weeks.map((weekStart) => {
            const weekKey = format(weekStart, 'yyyy-MM-dd');
            const weekContent = contentByWeek[weekKey] || [];

            return (
              <div key={weekKey} className="bg-white rounded-lg shadow">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">
                    Week of {format(weekStart, 'MMMM d, yyyy')}
                  </h3>
                </div>

                {weekContent.length === 0 ? (
                  <div className="px-6 py-8 text-center text-sm text-gray-500">
                    No LinkedIn posts scheduled for this week
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {weekContent.map((item) => (
                      <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {format(new Date(item.post_date), 'EEEE, MMM d')}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                {getStatusLabel(item.status)}
                              </span>
                            </div>

                            {item.content_needs && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Topic:</p>
                                <p className="text-sm text-gray-600">{item.content_needs}</p>
                              </div>
                            )}

                            {item.caption && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Caption:</p>
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">{item.caption}</p>
                              </div>
                            )}

                            {item.asset_link && (
                              <div className="mb-3">
                                <a
                                  href={item.asset_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm text-fm-blue hover:text-fm-navy"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  View Asset (Canva/Drive)
                                </a>
                              </div>
                            )}
                          </div>

                          {item.status !== 'scheduled' && item.status !== 'posted' && (
                            <button
                              onClick={() => handleMarkCreated(item.id)}
                              className="ml-4 px-4 py-2 text-sm font-medium text-white bg-fm-blue rounded-md hover:bg-fm-navy transition-colors"
                            >
                              Mark as Created
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {content.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-2">No LinkedIn content assigned to you yet.</p>
            <p className="text-sm text-gray-400">Check back later for new assignments!</p>
          </div>
        )}
      </div>
    </div>
  );
}
