'use client';

import React, { useState, useEffect } from 'react';
import { format, addWeeks, startOfWeek, endOfWeek } from 'date-fns';

// Parse YYYY-MM-DD as local midnight to avoid UTC-to-local timezone shift in US timezones.
// parseISO("2026-02-02") = UTC midnight = Feb 1 at 7pm EST → displays as Feb 1 (wrong).
// localDate("2026-02-02") = local midnight = Feb 2 at 12am EST → displays as Feb 2 (correct).
const localDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};
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
  onRowClick?: (content: ContentItem) => void;
  refreshTrigger: number;
  initialWeekOf?: string; // Optional: jump to a specific week (YYYY-MM-DD)
}

// Color-coded type badges — distinct from status colors (violet/rose/amber/cyan vs gray/blue/green/etc.)
const getTypeColor = (type: string, assignedTo?: string): string => {
  if (assignedTo === 'Beth') return 'bg-teal-100 text-teal-800';
  switch (type) {
    case 'Post':     return 'bg-violet-100 text-violet-800';
    case 'Reel':     return 'bg-rose-100 text-rose-800';
    case 'Story':    return 'bg-amber-100 text-amber-800';
    case 'Carousel': return 'bg-cyan-100 text-cyan-800';
    default:         return 'bg-slate-100 text-slate-700';
  }
};
const getTypeLabel = (type: string, assignedTo?: string): string => {
  if (assignedTo === 'Beth') return `${(type || '?').charAt(0)} BETH`;
  return type || '—';
};

export default function ContentTable({
  onEdit,
  onDelete,
  onDuplicate,
  onComment,
  onRowClick,
  refreshTrigger,
  initialWeekOf,
}: ContentTableProps) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [expandedCaptions, setExpandedCaptions] = useState<Set<number>>(new Set());

  // Calculate initial weekOffset from initialWeekOf prop if provided
  const getInitialOffset = () => {
    if (!initialWeekOf) return 0;
    const targetMonday = startOfWeek(localDate(initialWeekOf), { weekStartsOn: 1 });
    const currentMonday = startOfWeek(new Date(), { weekStartsOn: 1 });
    const diffMs = targetMonday.getTime() - currentMonday.getTime();
    return Math.round(diffMs / (7 * 24 * 60 * 60 * 1000));
  };

  const [weekOffset, setWeekOffset] = useState(getInitialOffset);

  useEffect(() => {
    fetchContent();
  }, [weekOffset, refreshTrigger]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      // Fetch ALL content — grouping by week_of (client-side) determines display.
      const response = await fetch('/api/social-content');
      const data = await response.json();
      const items: ContentItem[] = data.content || [];
      setContent(items);

      // Batch fetch comment counts in a SINGLE request (fixes N+1 slow load)
      if (items.length > 0) {
        const ids = items.map((i) => i.id).join(',');
        try {
          const countsRes = await fetch(`/api/social-content/comments?counts_for=${ids}`);
          const countsMap: Record<string, number> = await countsRes.json();
          const typedCounts: Record<number, number> = {};
          Object.entries(countsMap).forEach(([k, v]) => { typedCounts[parseInt(k)] = v; });
          setCommentCounts(typedCounts);
        } catch {
          // Non-fatal: counts just won't show badges
        }
      }
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

  // Two-step delete: first click arms, second click fires
  const handleDeleteClick = (id: number) => {
    if (confirmingDeleteId === id) {
      setConfirmingDeleteId(null);
      onDelete(id);
    } else {
      setConfirmingDeleteId(id);
      // Auto-reset after 3 seconds if user doesn't confirm
      setTimeout(() => setConfirmingDeleteId((prev) => (prev === id ? null : prev)), 3000);
    }
  };

  // Bulk selection helpers
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleWeekSelect = (weekItems: ContentItem[]) => {
    const weekIds = weekItems.map((i) => i.id);
    const allSelected = weekIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      weekIds.forEach((id) => allSelected ? next.delete(id) : next.add(id));
      return next;
    });
  };

  const toggleCaption = (id: number) => {
    setExpandedCaptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (!confirmingBulkDelete) {
      setConfirmingBulkDelete(true);
      setTimeout(() => setConfirmingBulkDelete(false), 3000);
      return;
    }
    setConfirmingBulkDelete(false);
    const ids = Array.from(selectedIds);
    setSelectedIds(new Set());
    for (const id of ids) { onDelete(id); }
  };

  // Group content by week - normalize week_of to date string format
  const contentByWeek: Record<string, ContentItem[]> = {};
  content.forEach((item) => {
    // Normalize week_of to YYYY-MM-DD format (handle both date strings and timestamps)
    const weekKey = item.week_of.split('T')[0];
    if (!contentByWeek[weekKey]) {
      contentByWeek[weekKey] = [];
    }
    contentByWeek[weekKey].push(item);
  });

  // Generate 8 weeks array (matches dashboard)
  const weeks = [];
  for (let i = 0; i < 8; i++) {
    const weekStart = startOfWeek(addWeeks(new Date(), weekOffset + i), { weekStartsOn: 1 });
    weeks.push(weekStart);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading content...</div>
      </div>
    );
  }

  const statusLabel = (status: string) =>
    status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const statusClass = (status: string) =>
    status === 'draft' ? 'bg-gray-200 text-gray-800' :
    status === 'paused' ? 'bg-yellow-200 text-yellow-800' :
    status === 'ready_for_approval' ? 'bg-blue-200 text-blue-800' :
    status === 'needs_edits' ? 'bg-orange-200 text-orange-800' :
    status === 'approved' ? 'bg-green-200 text-green-800' :
    status === 'scheduled' ? 'bg-purple-200 text-purple-800' :
    status === 'posted' ? 'bg-emerald-200 text-emerald-800' :
    'bg-gray-200 text-gray-800';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between">
        <button
          onClick={() => setWeekOffset(weekOffset - 8)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous 8 Weeks
        </button>

        <div className="flex items-center justify-center gap-3">
          <div className="text-sm font-medium text-gray-700 text-center">
            {format(weeks[0], 'MMM d')} – {format(endOfWeek(weeks[7], { weekStartsOn: 1 }), 'MMM d, yyyy')}
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
          onClick={() => setWeekOffset(weekOffset + 8)}
          className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Next 8 Weeks
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Type Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
        <span className="font-medium text-gray-500 uppercase tracking-wide">Type:</span>
        {[
          { label: 'Post', color: 'bg-violet-100 text-violet-800' },
          { label: 'Reel', color: 'bg-rose-100 text-rose-800' },
          { label: 'Story', color: 'bg-amber-100 text-amber-800' },
          { label: 'Carousel', color: 'bg-cyan-100 text-cyan-800' },
        ].map(({ label, color }) => (
          <span key={label} className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${color}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-fm-blue/10 border border-fm-blue/30 rounded-lg">
          <span className="text-sm font-medium text-fm-navy">{selectedIds.size} post{selectedIds.size > 1 ? 's' : ''} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-gray-600 hover:text-gray-800 px-2 py-1"
            >
              Clear
            </button>
            <button
              onClick={handleBulkDelete}
              className={`text-xs font-medium px-3 py-1.5 rounded transition-colors ${
                confirmingBulkDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-white text-red-600 border border-red-300 hover:bg-red-50'
              }`}
            >
              {confirmingBulkDelete ? '⚠ Click again to confirm delete' : `Delete ${selectedIds.size} selected`}
            </button>
          </div>
        </div>
      )}

      {/* ── Mobile card list (< md) ────────────────────────────────────── */}
      <div className="md:hidden space-y-6">
        {weeks.map((weekStart) => {
          const weekKey = format(weekStart, 'yyyy-MM-dd');
          const weekContent = contentByWeek[weekKey] || [];
          return (
            <div key={weekKey}>
              <div className="px-3 py-1.5 bg-gray-100 rounded-t-md text-sm font-semibold text-gray-700 border border-gray-200 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={weekContent.length > 0 && weekContent.every((i) => selectedIds.has(i.id))}
                  onChange={() => toggleWeekSelect(weekContent)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-gray-400 text-fm-blue focus:ring-fm-blue"
                  title="Select all this week"
                />
                Week of {format(weekStart, 'MMMM d, yyyy')}
              </div>
              {weekContent.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-500 text-center bg-white border border-t-0 border-gray-200 rounded-b-md">
                  No content scheduled
                </div>
              ) : (
                <div className="space-y-2 mt-1">
                  {weekContent.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => onRowClick?.(item)}
                      className={`bg-white rounded-lg border border-gray-200 p-3 shadow-sm ${selectedIds.has(item.id) ? 'ring-2 ring-fm-blue/50' : ''} ${onRowClick ? 'cursor-pointer active:bg-blue-50' : ''}`}
                    >
                      {/* Row 1: checkbox + date + type + platform + status */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelect(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border-gray-300 text-fm-blue focus:ring-fm-blue"
                          />
                          <span className="text-sm font-medium text-gray-900">
                            {format(localDate(item.post_date), 'MMM d')}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(item.content_type, item.assigned_to)}`}>
                            {getTypeLabel(item.content_type, item.assigned_to)}
                          </span>
                          <span className="text-xs text-gray-600">{item.platform}</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${statusClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </div>

                      {/* Row 2: caption or topic */}
                      {(item.caption || item.content_needs) && (() => {
                        const text = item.caption || item.content_needs || '';
                        const isLong = text.length > 120;
                        const isExpanded = expandedCaptions.has(item.id);
                        return (
                          <div className="mb-2">
                            {item.caption && (
                              <span className="inline-block mb-1 text-xs font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">caption</span>
                            )}
                            <p className={`text-sm text-gray-700 ${isExpanded ? '' : 'line-clamp-2'}`}>{text}</p>
                            {isLong && (
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleCaption(item.id); }}
                                className="text-xs text-fm-blue hover:underline mt-0.5"
                              >
                                {isExpanded ? 'Show less' : 'Show more'}
                              </button>
                            )}
                          </div>
                        );
                      })()}

                      {/* Row 3: actions */}
                      <div
                        className="flex items-center gap-3 pt-2 border-t border-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => onComment(item)}
                          className="text-gray-400 hover:text-fm-blue relative p-1"
                          title="Comments"
                        >
                          <MessageCircle className="w-4 h-4" />
                          {commentCounts[item.id] > 0 && (
                            <span className="absolute -top-1 -right-1 bg-fm-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                              {commentCounts[item.id]}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => onEdit(item)}
                          className="text-gray-400 hover:text-fm-blue p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicate(item)}
                          className="text-gray-400 hover:text-green-600 p-1"
                          title="Duplicate"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(item.id)}
                          className={`p-1 ml-auto text-xs flex items-center gap-1 rounded transition-colors ${
                            confirmingDeleteId === item.id
                              ? 'text-white bg-red-600 px-2'
                              : 'text-gray-400 hover:text-red-600'
                          }`}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                          {confirmingDeleteId === item.id && <span>Confirm?</span>}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Desktop table (md+) ────────────────────────────────────────── */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 w-8">
                  {/* no select-all in header; use week-level checkboxes */}
                </th>
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
                  Caption / Topic
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
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={weekContent.length > 0 && weekContent.every((i) => selectedIds.has(i.id))}
                          onChange={() => toggleWeekSelect(weekContent)}
                          className="rounded border-gray-400 text-fm-blue focus:ring-fm-blue"
                          title="Select all this week"
                        />
                      </td>
                      <td colSpan={8} className="px-6 py-2 text-sm font-semibold text-gray-700">
                        Week of {format(weekStart, 'MMMM d, yyyy')}
                      </td>
                    </tr>
                    {weekContent.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-4 text-sm text-gray-500 text-center">
                          No content scheduled for this week
                        </td>
                      </tr>
                    ) : (
                      weekContent.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => onRowClick?.(item)}
                          className={`hover:bg-blue-50 transition-colors ${selectedIds.has(item.id) ? 'bg-blue-50' : ''} ${onRowClick ? 'cursor-pointer' : ''}`}
                        >
                          <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.has(item.id)}
                              onChange={() => toggleSelect(item.id)}
                              className="rounded border-gray-300 text-fm-blue focus:ring-fm-blue"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {format(localDate(item.post_date), 'MMM d')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getTypeColor(item.content_type, item.assigned_to)}`}>
                              {getTypeLabel(item.content_type, item.assigned_to)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.platform}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            {(() => {
                              const text = item.caption || item.content_needs || '-';
                              const isLong = text.length > 120;
                              const isExpanded = expandedCaptions.has(item.id);
                              return (
                                <div>
                                  {item.caption && (
                                    <span className="inline-block mb-1 text-xs font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">caption</span>
                                  )}
                                  <p className={isExpanded ? '' : 'line-clamp-2'}>
                                    {text}
                                  </p>
                                  {isLong && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); toggleCaption(item.id); }}
                                      className="text-xs text-fm-blue hover:underline mt-0.5"
                                    >
                                      {isExpanded ? 'Show less' : 'Show more'}
                                    </button>
                                  )}
                                </div>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {item.asset_link ? (
                              <a
                                href={item.asset_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-fm-blue hover:text-fm-navy underline"
                              >
                                View
                              </a>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusClass(item.status)}`}>
                              {statusLabel(item.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.assigned_to}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div
                              className="flex items-center justify-end gap-2"
                              onClick={(e) => e.stopPropagation()}
                            >
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
                                className={`flex items-center gap-1 text-xs rounded transition-colors px-1 ${
                                  confirmingDeleteId === item.id
                                    ? 'text-white bg-red-600 px-2 py-0.5'
                                    : 'text-gray-400 hover:text-red-600'
                                }`}
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                                {confirmingDeleteId === item.id && <span>Confirm?</span>}
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
