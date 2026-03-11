'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
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
  const dateParam = searchParams.get('date') || undefined; // e.g. "2026-03-05" from a notification/shared link
  const contentIdParam = searchParams.get('content_id') || undefined; // e.g. comment notification deep-link
  // Track the last param combo we handled to avoid double-firing when the URL updates internally
  const lastHandledRef = useRef<string>('');

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

  const [threadSyncPrompt, setThreadSyncPrompt] = useState<{
    siblings: { id: number; platform: string }[];
    updates: { caption?: string; asset_link?: string };
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

  // Deep-link handler: fires whenever ?date= or ?content_id= params change (notification clicks,
  // shared links). Uses a dedupe ref so internal router.replace calls don't re-trigger this.
  useEffect(() => {
    if (!dateParam && !contentIdParam) return;
    const key = `${dateParam ?? ''}|${contentIdParam ?? ''}`;
    if (lastHandledRef.current === key) return; // already handled this exact combo
    lastHandledRef.current = key;

    fetch('/api/social-content')
      .then((r) => r.json())
      .then((data) => {
        const allContent: any[] = data.content || [];

        // Resolve the specific item if content_id was provided
        const cid = contentIdParam ? parseInt(contentIdParam, 10) : null;
        const targetItem = cid ? allContent.find((c: any) => c.id === cid) : null;

        // Determine which date to show (prefer explicit dateParam, fallback to item's date)
        const resolvedDate = dateParam ?? targetItem?.post_date?.slice(0, 10);
        if (!resolvedDate) return;

        // Filter day content — use .slice(0,10) to handle Postgres ISO timestamps
        const dayItems = allContent.filter((c: any) => c.post_date?.slice(0, 10) === resolvedDate);
        const [y, m, d] = resolvedDate.split('-').map(Number);
        setSelectedDate(new Date(y, m - 1, d));
        setSelectedDayContent(dayItems);
        setIsDayDetailOpen(true);

        // If a specific post was linked (from a comment notification), open its comment thread
        if (targetItem) {
          setSelectedContent(targetItem);
          setFieldContext(undefined);
          setIsCommentThreadOpen(true);
        }
      })
      .catch(() => {});
  }, [dateParam, contentIdParam]);

  const handleFormSubmit = async (data: any | any[]): Promise<void> => {
    // data is an array when creating/duplicating with multiple platforms selected
    const payloads: any[] = Array.isArray(data) ? data : [data];

    if (formMode === 'edit') {
      // Single edit — PUT and check for thread siblings needing a sync prompt
      const response = await fetch('/api/social-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads[0]),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || `Server error ${response.status}`);
      }
      const result = await response.json();
      if (result.thread_siblings?.length > 0) {
        const payload = payloads[0];
        setThreadSyncPrompt({
          siblings: result.thread_siblings,
          updates: {
            ...(payload.caption !== undefined && { caption: payload.caption }),
            ...(payload.asset_link !== undefined && { asset_link: payload.asset_link }),
          },
        });
        setTimeout(() => setThreadSyncPrompt(null), 12000);
      }
    } else {
      // POST (create / duplicate): chain thread_id from first response
      let sharedThreadId: number | null = null;
      for (const payload of payloads) {
        const postRes: Response = await fetch('/api/social-content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            // Pass the shared thread_id for 2nd, 3rd posts (or duplicate's inherited id)
            thread_id: payload.thread_id ?? sharedThreadId ?? undefined,
          }),
        });
        if (!postRes.ok) {
          const error = await postRes.json().catch(() => ({}));
          throw new Error(error.error || `Server error ${postRes.status}`);
        }
        if (sharedThreadId === null) {
          const postData: any = await postRes.json();
          sharedThreadId = postData.content?.thread_id ?? null;
        }
      }
    }

    setRefreshTrigger((prev) => prev + 1);
  };

  const handleMoveDate = async (id: number, newDate: string, threadId?: number) => {
    // Move a post (and optionally all thread siblings) to a new date
    const idsToMove: number[] = [id];

    if (threadId) {
      // Also move all siblings in the thread
      try {
        const res = await fetch(`/api/social-content?startDate=2020-01-01&endDate=2030-12-31`);
        const data = await res.json();
        const siblings = (data.content || []).filter(
          (c: any) => c.thread_id === threadId && c.id !== id
        );
        siblings.forEach((s: any) => idsToMove.push(s.id));
      } catch { /* non-fatal — move just the one post */ }
    }

    for (const sid of idsToMove) {
      await fetch('/api/social-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sid, post_date: newDate }),
      });
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Social Calendar</h1>
              <p className="hidden sm:block mt-1 text-sm text-gray-500">
                Plan and manage your Instagram, Facebook, and LinkedIn content
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-fm-blue shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">Table</span>
                </button>
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-fm-blue shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </button>
              </div>

              <button
                onClick={handleAddContent}
                className="flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors text-sm font-medium whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
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
        threadId={selectedContent?.thread_id}
        contentTitle={selectedContent?.content_needs}
        fieldContext={fieldContext}
      />

      {/* Thread sync toast — prompts to apply caption/asset edit to all sibling posts */}
      {threadSyncPrompt && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-white border border-blue-300 rounded-xl shadow-lg text-sm max-w-sm w-full mx-4">
          <span className="text-blue-500 text-base">🔗</span>
          <span className="flex-1 text-gray-700">
            Apply changes to{' '}
            {threadSyncPrompt.siblings.map((s) => s.platform).join(', ')} too?
          </span>
          <button
            onClick={async () => {
              for (const sibling of threadSyncPrompt.siblings) {
                await fetch('/api/social-content', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ id: sibling.id, ...threadSyncPrompt.updates }),
                });
              }
              setRefreshTrigger((p) => p + 1);
              setThreadSyncPrompt(null);
            }}
            className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 whitespace-nowrap"
          >
            Yes, sync
          </button>
          <button
            onClick={() => setThreadSyncPrompt(null)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
          >
            No
          </button>
        </div>
      )}

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
        onMoveDate={async (id, newDate, moveThread, threadId) => {
          await handleMoveDate(id, newDate, moveThread ? threadId : undefined);
          // Update the day modal content to reflect the move (post is now on a different date)
          setSelectedDayContent((prev) => prev.filter((c) => c.id !== id));
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
