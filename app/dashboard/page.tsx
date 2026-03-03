'use client';

import { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek } from 'date-fns';

// Parse YYYY-MM-DD as local midnight to avoid UTC-to-local timezone shift in US timezones
const localDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};
import { ExternalLink, Calendar, ArrowRight, Pencil, Check, X } from 'lucide-react';
import Link from 'next/link';

interface SocialFocus {
  id: number;
  sort_order: number;
  title: string;
  description: string | null;
  target_value: string | null;
}

interface ReportSnapshot {
  reportMonth: string | null;
  totalReach: number;
  totalViews: number;
  totalLikes: number;
  topPlatform: string | null;
}

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

  // Social Focuses
  const [focuses, setFocuses] = useState<SocialFocus[]>([]);
  const [editingFocus, setEditingFocus] = useState<number | null>(null);
  const [focusForm, setFocusForm] = useState({ title: '', description: '', target_value: '' });
  const [savingFocus, setSavingFocus] = useState(false);

  // Report snapshot
  const [reportSnapshot, setReportSnapshot] = useState<ReportSnapshot | null>(null);

  useEffect(() => {
    fetchTracker();
    fetchFocuses();
    fetchReportSnapshot();
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

  const fetchFocuses = async () => {
    try {
      const res = await fetch('/api/social-focuses');
      const data = await res.json();
      setFocuses(data.focuses || []);
    } catch (error) {
      console.error('Error fetching focuses:', error);
    }
  };

  const fetchReportSnapshot = async () => {
    try {
      const res = await fetch('/api/post-analytics?limit=200');
      const data = await res.json();
      const rows: any[] = data.posts || [];
      if (rows.length === 0) { setReportSnapshot({ reportMonth: null, totalReach: 0, totalViews: 0, totalLikes: 0, topPlatform: null }); return; }
      // Find latest report_month
      const latestMonth = rows.reduce((best: string, r: any) => r.report_month > best ? r.report_month : best, rows[0].report_month);
      const monthRows = rows.filter((r: any) => r.report_month === latestMonth);
      const totalReach = monthRows.reduce((s: number, r: any) => s + (Number(r.reach) || 0), 0);
      const totalViews = monthRows.reduce((s: number, r: any) => s + (Number(r.views) || 0), 0);
      const totalLikes = monthRows.reduce((s: number, r: any) => s + (Number(r.likes) || 0), 0);
      // Top platform by reach
      const byPlatform: Record<string, number> = {};
      monthRows.forEach((r: any) => { byPlatform[r.platform] = (byPlatform[r.platform] || 0) + (Number(r.reach) || 0); });
      const topPlatform = Object.entries(byPlatform).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      setReportSnapshot({ reportMonth: latestMonth, totalReach, totalViews, totalLikes, topPlatform });
    } catch (error) {
      console.error('Error fetching report snapshot:', error);
    }
  };

  const startEditFocus = (focus: SocialFocus) => {
    setEditingFocus(focus.sort_order);
    setFocusForm({ title: focus.title, description: focus.description || '', target_value: focus.target_value || '' });
  };

  const cancelEditFocus = () => { setEditingFocus(null); };

  const saveFocus = async (sortOrder: number) => {
    setSavingFocus(true);
    try {
      const res = await fetch('/api/social-focuses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sort_order: sortOrder, title: focusForm.title, description: focusForm.description || null, target_value: focusForm.target_value || null }),
      });
      if (res.ok) {
        setFocuses(prev => prev.map(f => f.sort_order === sortOrder ? { ...f, title: focusForm.title, description: focusForm.description || null, target_value: focusForm.target_value || null } : f));
        setEditingFocus(null);
      }
    } catch (error) {
      console.error('Error saving focus:', error);
    } finally {
      setSavingFocus(false);
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
                        {format(localDate(week.week_of), 'MMM d, yyyy')}
                      </div>
                      <div className="text-xs text-gray-500">
                        Week {Math.ceil((localDate(week.week_of).getTime() - new Date().getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1}
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

        {/* Top 3 Focuses */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Focuses</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {focuses.map((focus) => (
              <div key={focus.sort_order} className="bg-white rounded-lg shadow border-l-4 border-teal-500 p-4">
                {editingFocus === focus.sort_order ? (
                  <div className="space-y-3">
                    <input
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Title"
                      value={focusForm.title}
                      onChange={(e) => setFocusForm(f => ({ ...f, title: e.target.value }))}
                    />
                    <textarea
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none"
                      placeholder="Description (optional)"
                      rows={2}
                      value={focusForm.description}
                      onChange={(e) => setFocusForm(f => ({ ...f, description: e.target.value }))}
                    />
                    <input
                      className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Target (e.g. 10k reach/month)"
                      value={focusForm.target_value}
                      onChange={(e) => setFocusForm(f => ({ ...f, target_value: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveFocus(focus.sort_order)}
                        disabled={savingFocus}
                        className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white text-xs rounded hover:bg-teal-700 disabled:opacity-50"
                      >
                        <Check className="w-3 h-3" /> Save
                      </button>
                      <button
                        onClick={cancelEditFocus}
                        className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-teal-500 font-bold text-sm">{focus.sort_order}.</span>
                        <span className="font-semibold text-gray-900 text-sm">
                          {focus.title || <span className="text-gray-400 italic">No title</span>}
                        </span>
                      </div>
                      <button
                        onClick={() => startEditFocus(focus)}
                        className="text-gray-400 hover:text-teal-600 flex-shrink-0"
                        title="Edit focus"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {focus.description && (
                      <p className="text-xs text-gray-600 mt-1 ml-5">{focus.description}</p>
                    )}
                    {focus.target_value && (
                      <p className="text-xs text-teal-700 font-medium mt-1 ml-5">🎯 {focus.target_value}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Report Snapshot */}
          {reportSnapshot && (
            <div className="mt-4 bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Latest Meta Report
                  {reportSnapshot.reportMonth && (
                    <span className="ml-2 font-normal text-gray-500">
                      — {format(localDate(reportSnapshot.reportMonth.slice(0, 7) + '-01'), 'MMMM yyyy')}
                    </span>
                  )}
                </h3>
                <Link href="/reports" className="text-xs text-fm-blue hover:underline">View Reports</Link>
              </div>
              {reportSnapshot.reportMonth === null ? (
                <p className="text-sm text-gray-500 italic">No report data yet — upload a CSV on the Reports page.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Total Reach', value: reportSnapshot.totalReach.toLocaleString() },
                    { label: 'Total Views', value: reportSnapshot.totalViews.toLocaleString() },
                    { label: 'Total Likes', value: reportSnapshot.totalLikes.toLocaleString() },
                    { label: 'Top Platform', value: reportSnapshot.topPlatform ?? '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="text-lg font-bold text-gray-900">{value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
