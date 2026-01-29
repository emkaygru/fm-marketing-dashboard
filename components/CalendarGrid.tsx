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

interface ContentItem {
  id: number;
  post_date: string;
  content_type: string;
  platform: string;
  status: string;
  content_needs: string;
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
    return content.filter((item) => isSameDay(new Date(item.post_date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-200';
      case 'paused':
        return 'bg-yellow-200';
      case 'ready_for_approval':
        return 'bg-blue-200';
      case 'needs_edits':
        return 'bg-orange-200';
      case 'approved':
        return 'bg-green-200';
      case 'scheduled':
        return 'bg-purple-200';
      case 'posted':
        return 'bg-emerald-200';
      default:
        return 'bg-gray-200';
    }
  };

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
              className={`min-h-24 p-2 border-r border-b border-gray-200 last:border-r-0 cursor-pointer hover:bg-gray-50 transition-colors ${
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
                    className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(item.status)} truncate`}
                    title={`${item.platform} - ${item.content_needs || 'No description'}`}
                  >
                    <span className="mr-1">{getContentTypeIcon(item.content_type)}</span>
                    <span className="font-medium">{item.platform.slice(0, 2)}</span>
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
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-200 rounded"></div>
            <span>Draft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-200 rounded"></div>
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-200 rounded"></div>
            <span>Edits</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-200 rounded"></div>
            <span>Approved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-200 rounded"></div>
            <span>Scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-emerald-200 rounded"></div>
            <span>Posted</span>
          </div>
        </div>
      </div>
    </div>
  );
}
