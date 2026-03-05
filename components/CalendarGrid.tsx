'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Parse YYYY-MM-DD as local midnight to avoid UTC-to-local timezone shift in US timezones
const localDate = (dateStr: string): Date => {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

interface ContentItem {
  id: number;
  post_date: string;
  content_type: string;
  platform: string;
  status: string;
  content_needs: string;
  assigned_to?: string;
  thread_id?: number;
}

interface CalendarGridProps {
  onDayClick: (date: Date, content: ContentItem[]) => void;
  refreshTrigger: number;
}

export default function CalendarGrid({ onDayClick, refreshTrigger }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [currentMonth, refreshTrigger]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const monthStart = startOfMonth(currentMonth);
      const monthEnd = endOfMonth(currentMonth);

      const response = await fetch(
        `/api/social-content?startDate=${format(monthStart, 'yyyy-MM-dd')}&endDate=${format(monthEnd, 'yyyy-MM-dd')}`
      );
      const data = await response.json();
      setContent(data.content || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getContentForDay = (day: Date) => {
    return content.filter((item) => isSameDay(localDate(item.post_date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-200 text-gray-800';
      case 'paused':
        return 'bg-yellow-200 text-yellow-900';
      case 'ready_for_approval':
        return 'bg-blue-200 text-blue-900';
      case 'needs_edits':
        return 'bg-orange-200 text-orange-900';
      case 'approved':
        return 'bg-green-200 text-green-900';
      case 'scheduled':
        return 'bg-purple-200 text-purple-900';
      case 'posted':
        return 'bg-emerald-200 text-emerald-900';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };

  const getPlatformAcronym = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return 'IG';
      case 'Facebook':
        return 'FB';
      case 'LinkedIn':
        return 'LI';
      default:
        return platform.slice(0, 2).toUpperCase();
    }
  };

  // Left-border color on calendar blocks to indicate post type (distinct from status background)
  const getTypeBorderColor = (type: string, assignedTo?: string): string => {
    if (assignedTo === 'Beth') return 'border-l-teal-500';
    switch (type) {
      case 'Post':     return 'border-l-violet-500';
      case 'Reel':     return 'border-l-rose-500';
      case 'Story':    return 'border-l-amber-500';
      case 'Carousel': return 'border-l-cyan-500';
      default:         return 'border-l-slate-400';
    }
  };

  // Short abbreviation for type (used in tight calendar blocks)
  const getTypeAbbr = (type: string, assignedTo?: string): string => {
    if (assignedTo === 'Beth') return `${(type || '?').charAt(0)}B`;
    switch (type) {
      case 'Post':     return 'P';
      case 'Reel':     return 'R';
      case 'Story':    return 'S';
      case 'Carousel': return 'C';
      default:         return '?';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>

        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-gray-100 rounded-md transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-gray-600 border-r border-gray-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const dayContent = getContentForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              onClick={() => onDayClick(day, dayContent)}
              className={`min-h-20 md:min-h-24 p-1.5 md:p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday ? 'text-fm-blue font-bold' : ''}`}
              >
                {format(day, 'd')}
              </div>

              <div className="space-y-1">
                {dayContent.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className={`text-xs px-1.5 py-0.5 rounded border-l-[3px] ${getStatusColor(item.status)} ${getTypeBorderColor(item.content_type, item.assigned_to)} truncate`}
                    title={`${item.content_type} · ${item.platform} — ${item.content_needs || 'No description'}`}
                  >
                    <span className="font-bold mr-0.5 opacity-70">{getTypeAbbr(item.content_type, item.assigned_to)}</span>
                    <span className="font-semibold">{getPlatformAcronym(item.platform)}</span>
                  </div>
                ))}
                {dayContent.length > 3 && (
                  <div className="text-xs text-gray-500 font-medium">
                    +{dayContent.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
        {/* Status Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-700">
          <span className="font-semibold text-gray-500 uppercase tracking-wide">Status:</span>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-200 rounded"></div><span>Draft</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-yellow-200 rounded"></div><span>Paused</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-blue-200 rounded"></div><span>Ready</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-orange-200 rounded"></div><span>Edits</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-green-200 rounded"></div><span>Approved</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-purple-200 rounded"></div><span>Scheduled</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-emerald-200 rounded"></div><span>Posted</span></div>
        </div>
        {/* Type Legend (left border color) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-700">
          <span className="font-semibold text-gray-500 uppercase tracking-wide">Type:</span>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-100 rounded border-l-[3px] border-l-violet-500"></div><span>Post</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-100 rounded border-l-[3px] border-l-rose-500"></div><span>Reel</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-100 rounded border-l-[3px] border-l-amber-500"></div><span>Story</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 bg-gray-100 rounded border-l-[3px] border-l-cyan-500"></div><span>Carousel</span></div>
        </div>
      </div>
    </div>
  );
}
