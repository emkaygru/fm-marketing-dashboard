'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { format } from 'date-fns';
import { useSearchParams, useRouter } from 'next/navigation';
import { Plus, Calendar as CalendarIcon, List } from 'lucide-react';
import ContentTable from '@/components/ContentTable';
import CalendarGrid from '@/components/CalendarGrid';
import ContentForm from '@/components/ContentForm';
import CommentThread from '@/components/CommentThread';
import DayDetailModal from '@/components/DayDetailModal';

// Inner component — uses useSearchParams, must be inside <Suspense>
function SocialCalendarContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weekParam = searchParams.get('week') || undefined; // e.g. "2026-03-02" from dashboard "View" link
  const dateParam = searchParams.get('date') || undefined; // e.g. "2026-03-05" from a shared day link
  // Capture initial dateParam in a ref so our mount effect doesn't need it as a dep
  const initialDateParam = useRef(dateParam);

  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCommentThreadOpen, setIsCommentThreadOpen] = useState(false);
  const [isDayDetailOpen, setIsDayDetailOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDayContent, setSelectedDayContent] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [fieldContext, setFieldContext] = useState<string | undefined>(undefined);
  const [bulkApprovePrompt, setBulkApprovePrompt] = useState<{
    count: number; date: string; platform: string; ids: number[];
  } | null>(null);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('socialCalendarView');
    if (savedView === 'calendar' || savedView === 'table') {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'table' | 'calendar') => {
    setViewMode(mode);
    localStorage.setItem('socialCalendarView', mode);
  };

  const handleAddContent = () => {
    setFormMode('create');
    setSelectedContent(null);
    setIsFormOpen(true);
  };

  const handleEditContent = (content: any) => {
    setFormMode('edit');
    setSelectedContent(content);
    setIsFormOpen(true);
  };

  const handleDuplicateContent = (content: any) => {
    setFormMode('duplicate');
    setSelectedContent(content);
    setIsFormOpen(true);
  };

  const handleCommentContent = (content: any) => {
    setSelectedContent(content);
    setFieldContext(undefined);
    setIsCommentThreadOpen(true);
  };

  const handleCommentWithContext = (content: any, context: string) => {
    setSelectedContent(content);
    setFieldContext(context);
    setIsCommentThreadOpen(true);
  };

  // ── Shared day deep-link helpers ──────────────────────────────────────
  const openDayModal = (date: Date, dayContent: any[]) => {
    setSelectedDate(date);
    setSelectedDayContent(dayContent);
    setIsDayDetailOpen(true);
    router.replace(`/social-calendar?date=${format(date, 'yyyy-MM-dd')}`, { scroll: false });
  };

  const closeDayModal = () => {
    setIsDayDetailOpen(false);
    router.replace('/social-calendar', { scroll: false });
  };

  // On mount: if a ?date= param is present (shared link), open the modal for that day
  useEffect(() => {
    const param = initialDateParam.current;
    if (!param) return;
    // Switch to calendar view for a nicer shared experience
    setViewMode('calendar');
    fetch('/api/social-content')
      .then((r) => r.json())
      .then((data) => {
        const items = (data.content || []).filter((c: any) => c.post_date === param);
        const [y, m, d] = param.split('-').map(Number);
        setSelectedDate(new Date(y, m - 1, d));
        setSelectedDayContent(items);
        setIsDayDetailOpen(true);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFormSubmit = async (data: any | any[]): Promise<void> => {
    // data is an array when creating/duplicating with multiple platforms selected
    const payloads: any[] = Array.isArray(data) ? data : [data];
    const method = formMode === 'edit' ? 'PUT' : 'POST';

    for (const payload of payloads) {
      const response = await fetch('/api/social-content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Server error ${response.status}`);
      }
    }

    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteContent = async (id: number) => {
    try {
      const response = await fetch(`/api/social-content?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Calendar</h1>
              <p className="mt-1 text-sm text-gray-500">
                Plan and manage your Instagram, Facebook, and LinkedIn content
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-fm-blue shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Table
                </button>
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-fm-blue shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Calendar
                </button>
              </div>

              <button
                onClick={handleAddContent}
                className="flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Content
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'table' ? (
          <ContentTable
            onEdit={handleEditContent}
            onDelete={handleDeleteContent}
            onDuplicate={handleDuplicateContent}
            onComment={handleCommentContent}
            onRowClick={(item) => {
              const [y, m, d] = item.post_date.split('-').map(Number);
              openDayModal(new Date(y, m - 1, d), [item]);
            }}
            refreshTrigger={refreshTrigger}
            initialWeekOf={weekParam}
          />
        ) : (
          <CalendarGrid
            onDayClick={(date, dayContent) => {
              openDayModal(date, dayContent);
            }}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Modals */}
      <ContentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedContent}
        mode={formMode}
      />

      <CommentThread
        isOpen={isCommentThreadOpen}
        onClose={() => { setIsCommentThreadOpen(false); setFieldContext(undefined); }}
        contentId={selectedContent?.id}
        contentTitle={selectedContent?.content_needs}
        fieldContext={fieldContext}
      />

      {/* Bulk approve toast */}
      {bulkApprovePrompt && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-green-300 rounded-xl shadow-lg text-sm max-w-sm w-full mx-4">
          <span className="text-green-600 text-base">✅</span>
          <span className="flex-1 text-gray-700">
            Approve {bulkApprovePrompt.count} other post{bulkApprovePrompt.count > 1 ? 's' : ''} on {bulkApprovePrompt.date} for {bulkApprovePrompt.platform}?
          </span>
          <button
            onClick={async () => {
              for (const sid of bulkApprovePrompt.ids) {
                await fetch('/api/social-content', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: sid, status: 'approved' }),
                });
              }
              setRefreshTrigger((p) => p + 1);
              setBulkApprovePrompt(null);
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 whitespace-nowrap"
          >
            Yes, all
          </button>
          <button
            onClick={() => setBulkApprovePrompt(null)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            No
          </button>
        </div>
      )}

      <DayDetailModal
        isOpen={isDayDetailOpen}
        onClose={closeDayModal}
        date={selectedDate}
        content={selectedDayContent}
        onEdit={handleEditContent}
        onDuplicate={handleDuplicateContent}
        onComment={handleCommentContent}
        onCommentWithContext={handleCommentWithContext}
        onDelete={async (id) => {
          await handleDeleteContent(id);
          setSelectedDayContent(selectedDayContent.filter((c) => c.id !== id));
        }}
        onStatusChange={async (id, status) => {
          try {
            const response = await fetch('/api/social-content', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, status }),
            });
            if (response.ok) {
              setRefreshTrigger((prev) => prev + 1);
              const updatedDay = selectedDayContent.map((c) => (c.id === id ? { ...c, status } : c));
              setSelectedDayContent(updatedDay);

              // Bulk approve prompt: if just approved, check for same-date same-platform siblings
              if (status === 'approved') {
                const justApproved = selectedDayContent.find((c) => c.id === id);
                if (justApproved) {
                  const siblings = updatedDay.filter(
                    (c) => c.id !== id &&
                      c.post_date === justApproved.post_date &&
                      c.platform === justApproved.platform &&
                      c.status !== 'approved' && c.status !== 'posted'
                  );
                  if (siblings.length > 0) {
                    setBulkApprovePrompt({
                      count: siblings.length,
                      date: format(selectedDate!, 'MMM d'),
                      platform: justApproved.platform,
                      ids: siblings.map((c) => c.id),
                    });
                    setTimeout(() => setBulkApprovePrompt(null), 8000);
                  }
                }
              }
            }
          } catch (error) {
            console.error('Error updating status:', error);
          }
        }}
        onAddContent={() => {
          setFormMode('create');
          setSelectedContent(selectedDate ? { post_date: format(selectedDate, 'yyyy-MM-dd') } : null);
          setIsFormOpen(true);
        }}
      />
    </div>
  );
}

// Outer page — wraps inner component in Suspense (required by Next.js for useSearchParams)
export default function SocialCalendarPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><div className="text-gray-500">Loading...</div></div>}>
      <SocialCalendarContent />
    </Suspense>
  );
}
