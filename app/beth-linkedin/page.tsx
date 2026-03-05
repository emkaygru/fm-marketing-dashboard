'use client';

import { useState, useEffect, useRef } from 'react';
import {
  format, addWeeks, startOfWeek, endOfWeek, parseISO,
  startOfMonth, endOfMonth, addMonths,
} from 'date-fns';
import { ExternalLink, ChevronLeft, ChevronRight, Check, Save, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface LinkedInPost {
  id: number;
  post_date: string;
  week_of: string;
  content_type: string;
  content_needs: string;
  asset_link: string;
  caption: string;
  graphic_text: string;
  beth_schedule_approved: boolean;
  status: string;
}

interface BlogPost {
  id: number;
  title: string;
  topic: string | null;
  author: string | null;
  publish_date: string;
  link: string | null;
  doc_link: string | null;
  beth_complete: boolean;
  status: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const localDate = (s: string) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };

const statusClass = (status: string) => {
  switch (status) {
    case 'draft':            return 'bg-gray-100 text-gray-700';
    case 'ready_for_approval':
    case 'approved':         return 'bg-green-100 text-green-800';
    case 'scheduled':
    case 'posted':           return 'bg-purple-100 text-purple-800';
    case 'in_progress':      return 'bg-yellow-100 text-yellow-800';
    case 'published':        return 'bg-emerald-100 text-emerald-800';
    default:                 return 'bg-blue-100 text-blue-800';
  }
};

const statusLabel = (s: string) => s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ── LinkedIn Post Card ────────────────────────────────────────────────────────
function LIPostCard({ item, onSaved }: { item: LinkedInPost; onSaved: (updated: Partial<LinkedInPost> & { id: number }) => void }) {
  const [graphicText, setGraphicText] = useState(item.graphic_text || '');
  const [caption, setCaption] = useState(item.caption || '');
  const [scheduleApproved, setScheduleApproved] = useState(item.beth_schedule_approved || false);
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(item.status === 'scheduled' || item.status === 'posted');

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      await fetch('/api/social-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, ...patch }),
      });
      onSaved({ id: item.id, ...patch } as any);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    await save({ status: 'scheduled' });
    setComplete(true);
  };

  const handleScheduleToggle = async (checked: boolean) => {
    setScheduleApproved(checked);
    await save({ beth_schedule_approved: checked });
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 transition-opacity ${complete ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {item.post_date ? format(localDate(item.post_date), 'EEE, MMM d') : '—'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
            {item.content_type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(item.status)}`}>
            {statusLabel(item.status)}
          </span>
          {complete && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Complete
            </span>
          )}
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        </div>
        {!complete && (
          <button
            onClick={handleMarkComplete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-fm-blue rounded-md hover:bg-fm-navy transition-colors"
          >
            <Check className="w-3.5 h-3.5" /> Mark Complete
          </button>
        )}
      </div>

      {/* Topic from Emily (read-only) */}
      {item.content_needs && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-100 rounded-md">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Topic from Emily</p>
          <p className="text-sm text-gray-800">{item.content_needs}</p>
        </div>
      )}

      {/* Asset link (read-only) */}
      {item.asset_link && (
        <div className="mb-3">
          <a
            href={item.asset_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-fm-blue hover:text-fm-navy"
          >
            <ExternalLink className="w-4 h-4" /> View Asset (Canva/Drive)
          </a>
        </div>
      )}

      {/* Beth's editable fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Text for Graphic</label>
          <textarea
            value={graphicText}
            onChange={(e) => setGraphicText(e.target.value)}
            onBlur={() => save({ graphic_text: graphicText })}
            disabled={complete}
            rows={2}
            placeholder="Enter the text that will appear on the graphic…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Your Caption</label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            onBlur={() => save({ caption })}
            disabled={complete}
            rows={4}
            placeholder="Write your LinkedIn caption here…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-400 resize-none"
          />
        </div>

        <label className={`flex items-center gap-3 cursor-pointer ${complete ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="checkbox"
            checked={scheduleApproved}
            onChange={(e) => handleScheduleToggle(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm font-medium text-gray-700">
            ✅ Yes, please schedule this post for me
          </span>
        </label>
      </div>
    </div>
  );
}

// ── Blog Post Card ────────────────────────────────────────────────────────────
function BlogPostCard({ post, onSaved }: { post: BlogPost; onSaved: (updated: BlogPost) => void }) {
  const [title, setTitle] = useState(post.title || '');
  const [topic, setTopic] = useState(post.topic || '');
  const [docLink, setDocLink] = useState(post.doc_link || '');
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(post.beth_complete || false);
  const [dirty, setDirty] = useState(false);
  const prevDoc = useRef(docLink);

  const save = async (patch: Record<string, unknown>) => {
    setSaving(true);
    try {
      const res = await fetch('/api/blog-posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, ...patch }),
      });
      const data = await res.json();
      if (data.post) onSaved(data.post);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    await save({ beth_complete: true, title, topic, doc_link: docLink });
    setComplete(true);
  };

  return (
    <div className={`border border-gray-200 rounded-lg p-4 transition-opacity ${complete ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {post.publish_date ? format(localDate(post.publish_date), 'EEE, MMM d') : '—'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClass(post.status)}`}>
            {statusLabel(post.status)}
          </span>
          {complete && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Complete
            </span>
          )}
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
        </div>
        <div className="flex items-center gap-2">
          {dirty && !complete && (
            <button
              onClick={() => save({ title, topic, doc_link: docLink })}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-900 transition-colors"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
          {!complete && (
            <button
              onClick={handleMarkComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-fm-blue rounded-md hover:bg-fm-navy transition-colors"
            >
              <Check className="w-3.5 h-3.5" /> Mark Complete
            </button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Blog Post Title</label>
          <input
            value={title}
            onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
            disabled={complete}
            placeholder="Post title…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Topic / Summary</label>
          <input
            value={topic}
            onChange={(e) => { setTopic(e.target.value); setDirty(true); }}
            disabled={complete}
            placeholder="What is this post about?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            Link to your .docx{' '}
            <span className="font-normal text-gray-400">(Google Drive, Dropbox, etc.)</span>
          </label>
          <input
            type="url"
            value={docLink}
            onChange={(e) => { setDocLink(e.target.value); setDirty(true); }}
            onBlur={() => {
              if (docLink !== prevDoc.current) {
                prevDoc.current = docLink;
                save({ doc_link: docLink });
              }
            }}
            disabled={complete}
            placeholder="https://drive.google.com/…"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        {post.link && (
          <a
            href={post.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-fm-blue hover:text-fm-navy"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Published Post
          </a>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BethLinkedInPage() {
  const [posts, setPosts] = useState<LinkedInPost[]>([]);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const weeks = Array.from({ length: 4 }, (_, i) =>
    startOfWeek(addWeeks(new Date(), weekOffset + i), { weekStartsOn: 1 })
  );

  useEffect(() => {
    fetchPosts();
  }, [weekOffset]);

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const startDate = format(weeks[0], 'yyyy-MM-dd');
      const endDate = format(endOfWeek(weeks[3], { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const res = await fetch(`/api/social-content?startDate=${startDate}&endDate=${endDate}&platform=LinkedIn`);
      const data = await res.json();
      setPosts((data.content || []).filter((i: any) => i.assigned_to === 'Beth'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlogPosts = async () => {
    const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const end = format(endOfMonth(addMonths(new Date(), 1)), 'yyyy-MM-dd');
    try {
      const res = await fetch(`/api/blog-posts?startDate=${start}&endDate=${end}`);
      const data = await res.json();
      setBlogPosts(data.posts || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Group posts by week — fall back to computing from post_date if week_of is null
  const postsByWeek: Record<string, LinkedInPost[]> = {};
  posts.forEach((p) => {
    const key = p.week_of
      ? p.week_of.split('T')[0]
      : format(startOfWeek(localDate(p.post_date), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    if (!postsByWeek[key]) postsByWeek[key] = [];
    postsByWeek[key].push(p);
  });

  const handlePostSaved = (updated: Partial<LinkedInPost> & { id: number }) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)));
  };

  const handleBlogSaved = (updated: BlogPost) => {
    setBlogPosts((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Beth's LinkedIn Hub</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in your content below. Changes save automatically — just click "Mark Complete" when you're done with each item.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Section A: LinkedIn Posts ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">LinkedIn Posts</h2>
              <p className="text-sm text-gray-500">8 posts/month · Fill in your graphic text, caption, and scheduling preference</p>
            </div>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setWeekOffset((o) => o - 4)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" /> Prev 4 Weeks
            </button>
            <span className="text-sm font-medium text-gray-700">
              {format(weeks[0], 'MMM d')} – {format(endOfWeek(weeks[3], { weekStartsOn: 1 }), 'MMM d, yyyy')}
              {weekOffset !== 0 && (
                <button
                  onClick={() => setWeekOffset(0)}
                  className="ml-3 text-xs text-fm-blue hover:text-fm-navy underline"
                >
                  Today
                </button>
              )}
            </span>
            <button
              onClick={() => setWeekOffset((o) => o + 4)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next 4 Weeks <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading posts…</div>
          ) : (
            <div className="space-y-6">
              {weeks.map((weekStart) => {
                const key = format(weekStart, 'yyyy-MM-dd');
                const weekPosts = postsByWeek[key] || [];
                return (
                  <div key={key} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="px-4 py-3 bg-teal-50 border-b border-teal-100">
                      <h3 className="text-sm font-semibold text-teal-800">
                        Week of {format(weekStart, 'MMMM d, yyyy')}
                        <span className="ml-2 font-normal text-teal-600">({weekPosts.length} post{weekPosts.length !== 1 ? 's' : ''})</span>
                      </h3>
                    </div>
                    {weekPosts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-400">
                        No LinkedIn posts scheduled for this week
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        {weekPosts.map((p) => (
                          <LIPostCard key={p.id} item={p} onSaved={handlePostSaved} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && posts.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No LinkedIn content assigned to you in this date range.</p>
              <p className="text-sm text-gray-400 mt-1">Try navigating to a different 4-week window.</p>
            </div>
          )}
        </section>

        {/* ── Section B: Blog Posts ── */}
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Blog Posts</h2>
            <p className="text-sm text-gray-500">
              4 posts/month · Add your title, topic summary, and a link to your .docx when ready
            </p>
          </div>

          {blogPosts.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <p className="text-gray-500">No blog posts scheduled for this month or next.</p>
              <p className="text-sm text-gray-400 mt-1">Emily will add them to your schedule soon.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                <h3 className="text-sm font-semibold text-orange-800">
                  {format(startOfMonth(new Date()), 'MMMM yyyy')} – {format(endOfMonth(addMonths(new Date(), 1)), 'MMMM yyyy')}
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {blogPosts.map((b) => (
                  <BlogPostCard key={b.id} post={b} onSaved={handleBlogSaved} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
