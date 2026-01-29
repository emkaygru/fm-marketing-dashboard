'use client';

import { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek } from 'date-fns';
import { ExternalLink, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface TrackerWeek {
  week_of: string;
  blog_post: {
    id: number;
    title: string;
    link: string;
    status: string;
    author: string;
    publish_date: string;
  } | null;
  beth_linkedin: {
    count: number;
    posted_count: number;
    status: 'none' | 'planned' | 'posted';
  };
  social_media: {
    total: number;
    posted: number;
    scheduled: number;
    approved: number;
    ready: number;
    draft: number;
    status: 'none' | 'draft' | 'ready' | 'approved' | 'scheduled' | 'posted';
  };
}

export default function DashboardPage() {
  const [tracker, setTracker] = useState<TrackerWeek[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTracker();
  }, []);

  const fetchTracker = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content-tracker?weeks=8');
      const data = await response.json();
      setTracker(data.tracker || []);
    } catch (error) {
      console.error('Error fetching content tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'none':
        return 'bg-gray-200 text-gray-700';
      case 'draft':
        return 'bg-gray-300 text-gray-800';
      case 'planned':
        return 'bg-blue-200 text-blue-800';
      case 'ready':
        return 'bg-blue-300 text-blue-900';
      case 'approved':
        return 'bg-green-200 text-green-800';
      case 'scheduled':
        return 'bg-purple-200 text-purple-800';
      case 'posted':
      case 'published':
        return 'bg-emerald-200 text-emerald-800';
      case 'in_progress':
        return 'bg-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const getStatusLabel = (status: string, count?: number) => {
    if (status === 'none') return 'Not Started';
    if (count !== undefined && count > 0) {
      return `${status.charAt(0).toUpperCase() + status.slice(1)} (${count})`;
    }
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Planning Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">
              Weekly overview of blog posts, LinkedIn content, and social media planning
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Link
            href="/social-calendar"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-fm-blue"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-fm-blue" />
              <div>
                <div className="font-semibold text-gray-900">Social Calendar</div>
                <div className="text-xs text-gray-500">Plan posts</div>
              </div>
            </div>
          </Link>

          <Link
            href="/blog-posts"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-fm-orange"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-fm-orange" />
              <div>
                <div className="font-semibold text-gray-900">Blog Posts</div>
                <div className="text-xs text-gray-500">Manage blogs</div>
              </div>
            </div>
          </Link>

          <Link
            href="/beth-linkedin"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-purple-500"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-purple-500" />
              <div>
                <div className="font-semibold text-gray-900">Beth's LinkedIn</div>
                <div className="text-xs text-gray-500">LinkedIn content</div>
              </div>
            </div>
          </Link>

          <Link
            href="/analytics"
            className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border-l-4 border-green-500"
          >
            <div className="flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-green-500" />
              <div>
                <div className="font-semibold text-gray-900">Analytics</div>
                <div className="text-xs text-gray-500">View metrics</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Content Flow Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">Content Flow (8 Weeks)</h2>
            <p className="text-sm text-gray-500 mt-1">
              Track content progression from blog → LinkedIn → social media
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week Of
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blog Post (Last Week)
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beth's LinkedIn
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Social Media
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tracker.map((week) => (
                  <tr key={week.week_of} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {format(new Date(week.week_of), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Week {Math.ceil((new Date(week.week_of).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}
                      </div>
                    </td>

                    {/* Blog Post */}
                    <td className="px-6 py-4">
                      {week.blog_post ? (
                        <div>
                          <div className="text-sm text-gray-900 line-clamp-1 max-w-xs">
                            {week.blog_post.title}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(week.blog_post.status)}`}>
                              {getStatusLabel(week.blog_post.status)}
                            </span>
                            {week.blog_post.link && (
                              <a
                                href={week.blog_post.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fm-blue hover:text-fm-navy"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No blog post</span>
                      )}
                    </td>

                    {/* Arrow */}
                    <td className="px-2 py-4 text-center">
                      <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                    </td>

                    {/* Beth's LinkedIn */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(week.beth_linkedin.status)}`}>
                        {getStatusLabel(week.beth_linkedin.status, week.beth_linkedin.count)}
                      </span>
                    </td>

                    {/* Arrow */}
                    <td className="px-2 py-4 text-center">
                      <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
                    </td>

                    {/* Social Media */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(week.social_media.status)}`}>
                          {getStatusLabel(week.social_media.status, week.social_media.total)}
                        </span>
                        {week.social_media.total > 0 && (
                          <Link
                            href={`/social-calendar?week=${week.week_of}`}
                            className="text-xs text-fm-blue hover:text-fm-navy underline"
                          >
                            View
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Status Legend</h3>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('none')}`}></div>
              <span className="text-gray-700">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('draft')}`}></div>
              <span className="text-gray-700">Draft</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('planned')}`}></div>
              <span className="text-gray-700">Planned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('in_progress')}`}></div>
              <span className="text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('approved')}`}></div>
              <span className="text-gray-700">Approved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('scheduled')}`}></div>
              <span className="text-gray-700">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${getStatusColor('posted')}`}></div>
              <span className="text-gray-700">Posted/Published</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
