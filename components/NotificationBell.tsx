'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, X, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  type: string;
  message: string;
  content_id: number | null;
  comment_id: number | null;
  author_name: string;
  created_at: string;
  post_title: string | null;
  post_date: string | null;
}

const STORAGE_KEY = 'fm_seen_notif_ids';

function getSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch {
    return new Set();
  }
}

function saveSeenIds(ids: Set<number>) {
  try {
    // Only keep last 500 IDs to avoid unbounded growth
    const arr = Array.from(ids).slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {}
}

// Return the URL to navigate to when clicking a notification, or null if not navigable
function getNotifLink(n: Notification): string | null {
  if (n.type === 'beth_blog') return '/blog-posts';
  if (n.post_date) return `/social-calendar?date=${n.post_date.split('T')[0]}`;
  if (n.content_id) return `/social-calendar`;
  return null;
}

// Avatar initials + color by author
function avatarInfo(author: string): { initials: string; color: string } {
  if (author === 'Beth') return { initials: 'B', color: 'bg-teal-100 text-teal-700' };
  if (author === 'Victoria') return { initials: 'V', color: 'bg-fm-orange/20 text-fm-orange' };
  const initials = author ? author.charAt(0).toUpperCase() : '?';
  return { initials, color: 'bg-gray-100 text-gray-600' };
}

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return;
      const data = await res.json();
      const notifs: Notification[] = data.notifications || [];
      setNotifications(notifs);

      const seen = getSeenIds();
      const unread = notifs.filter((n) => !seen.has(n.id)).length;
      setUnreadCount(unread);
    } catch {
      // Silent fail — notification bell is non-critical
    }
  }, []);

  // Fetch on mount + poll every 30 seconds + on window focus
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    window.addEventListener('focus', fetchNotifications);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', fetchNotifications);
    };
  }, [fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        // Mark all current notifications as seen
        const seen = getSeenIds();
        notifications.forEach((n) => seen.add(n.id));
        saveSeenIds(seen);
        setUnreadCount(0);
      }
      return next;
    });
  };

  const handleMarkAllRead = () => {
    const seen = getSeenIds();
    notifications.forEach((n) => seen.add(n.id));
    saveSeenIds(seen);
    setUnreadCount(0);
    setIsOpen(false);
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {/* Dropdown panel — opens upward */}
      {isOpen && (
        <div className="w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-fm-blue" />
              <span className="text-sm font-semibold text-gray-900">Notifications</span>
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-fm-blue hover:text-fm-navy font-medium"
                >
                  Mark all read
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8 px-4">
                No notifications yet. Victoria's comments will appear here.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((n) => {
                  const seen = getSeenIds();
                  const isUnread = !seen.has(n.id);
                  const link = getNotifLink(n);
                  const { initials, color } = avatarInfo(n.author_name);
                  return (
                    <li
                      key={n.id}
                      onClick={() => {
                        if (link) {
                          setIsOpen(false);
                          router.push(link);
                        }
                      }}
                      className={`px-4 py-3 flex gap-3 transition-colors
                        ${isUnread ? 'bg-fm-blue/5' : ''}
                        ${link ? 'cursor-pointer hover:bg-gray-50' : ''}
                      `}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${color}`}>
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-800 leading-snug">
                          {n.message}
                        </p>
                        {n.post_title && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{n.post_title}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {isUnread && (
                          <div className="w-2 h-2 rounded-full bg-fm-orange mt-1" />
                        )}
                        {link && (
                          <ArrowRight className="w-3.5 h-3.5 text-gray-300 mt-auto" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-400 text-center">
              Click a notification to jump to the post
            </p>
          </div>
        </div>
      )}

      {/* Bell button */}
      <button
        onClick={handleOpen}
        className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-colors relative ${
          isOpen ? 'bg-fm-blue text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
        }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-fm-orange text-white text-xs font-bold rounded-full flex items-center justify-center px-0.5">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
