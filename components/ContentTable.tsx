'use client';

import React, { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Edit2, Trash2, Copy, MessageCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

interface ContentItem {
  id: number;
  post_date: string;
  week_of: string;
  content_type: string;
  platform: string;
  content_needs: string;
  asset_link: string;
  caption: string;
  status: string;
  assigned_to: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface ContentTableProps {
  onEdit: (content: ContentItem) => void;
  onDelete: (id: number) => void;
  onDuplicate: (content: ContentItem) => void;
  onComment: (content: ContentItem) => void;
  refreshTrigger: number;
}

export default function ContentTable({
  onEdit,
  onDelete,
  onDuplicate,
  onComment,
  refreshTrigger,
}: ContentTableProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week, etc.
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    fetchContent();
  }, [weekOffset, refreshTrigger]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Calculate date range for 4 weeks starting from weekOffset
      const startDate = startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 });
      const endDate = endOfWeek(addWeeks(startDate, 3), { weekStartsOn: 1 });

      const response = await fetch(
        `/api/social-content?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
      );
      const data = await response.json();
      setContent(data.content || []);

      // Fetch comment counts for all content
      const counts: Record<number, number> = {};
      for (const item of data.content || []) {
        try {
          const commentsResponse = await fetch(`/api/social-content/comments?content_id=${item.id}`);
          const commentsData = await commentsResponse.json();
          counts[item.id] = commentsData.count || 0;
        } catch (error) {
          counts[item.id] = 0;
        }
      }
      setCommentCounts(counts);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      const response = await fetch('/api/social-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        await fetchContent();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteClick = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      onDelete(id);
    }
  };

  // Group content by week
  const contentByWeek: Record<string, ContentItem[]> = {};
  content.forEach((item) => {
    if (!contentByWeek[item.week_of]) {
      contentByWeek[item.week_of] = [];
    }
    contentByWeek[item.week_of].push(item);
  });

  // Generate 4 weeks array
  const weeks = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = startOfWeek(addWeeks(new Date(), weekOffset + i), { weekStartsOn: 1 });
    weeks.push(weekStart);
  }

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'Post':
        return '📸';
      case 'Reel':
        return '🎬';
      case 'Story':
        return '📖';
      default:
        return '📄';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(weekOffset - 4)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous 4 Weeks
        </button>

        <div className="text-sm font-medium text-gray-700">
          {format(weeks[0], 'MMM d')} - {format(endOfWeek(weeks[3], { weekStartsOn: 1 }), 'MMM d, yyyy')}
        </div>

        <button
          onClick={() => setWeekOffset(weekOffset + 4)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Next 4 Weeks
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Content Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content / Topic
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weeks.map((weekStart) => {
                const weekKey = format(weekStart, 'yyyy-MM-dd');
                const weekContent = contentByWeek[weekKey] || [];

                return (
                  <React.Fragment key={weekKey}>
                    <tr className="bg-gray-100">
                      <td colSpan={8} className="px-6 py-2 text-sm font-semibold text-gray-700">
                        Week of {format(weekStart, 'MMMM d, yyyy')}
                      </td>
                    </tr>
                    {weekContent.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-4 text-sm text-gray-500 text-center">
                          No content scheduled for this week
                        </td>
                      </tr>
                    ) : (
                      weekContent.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(new Date(item.post_date), 'MMM d')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span title={item.content_type}>
                              {getContentTypeIcon(item.content_type)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.platform}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            <div className="line-clamp-2">{item.content_needs || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.asset_link ? (
                              <a
                                href={item.asset_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-fm-blue hover:text-fm-navy underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              className="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer"
                            >
                              <option value="draft">Draft</option>
                              <option value="paused">Paused</option>
                              <option value="ready_for_approval">Ready for Approval</option>
                              <option value="needs_edits">Needs Edits</option>
                              <option value="approved">Approved</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="posted">Posted</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.assigned_to}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => onComment(item)}
                                className="text-gray-400 hover:text-fm-blue relative"
                                title="Comments"
                              >
                                <MessageCircle className="w-4 h-4" />
                                {commentCounts[item.id] > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-fm-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                    {commentCounts[item.id]}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => onDuplicate(item)}
                                className="text-gray-400 hover:text-green-600"
                                title="Duplicate"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onEdit(item)}
                                className="text-gray-400 hover:text-fm-blue"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item.id)}
                                className="text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
