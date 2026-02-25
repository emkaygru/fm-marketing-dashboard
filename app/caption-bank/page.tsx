'use client';

import { useState, useEffect } from 'react';
import { Copy, ExternalLink, Search, Instagram, Facebook, Bookmark, BookmarkCheck, Trash2, Plus, X, Check } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────
interface LiveCaption {
  platform: string;
  text: string;
  date: string;
  media_type: string;
  permalink: string | null;
  likes: number;
}

interface SavedCaption {
  id: number;
  text: string;
  platform: string | null;
  source: string;
  notes: string | null;
  original_date: string | null;
  original_permalink: string | null;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const PlatformBadge = ({ platform }: { platform: string | null }) => {
  if (platform === 'Instagram')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
        <Instagram className="w-3 h-3" /> Instagram
      </span>
    );
  if (platform === 'Facebook')
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Facebook className="w-3 h-3" /> Facebook
      </span>
    );
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      {platform || 'Manual'}
    </span>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────
export default function CaptionBankPage() {
  const [tab, setTab] = useState<'saved' | 'accounts'>('saved');

  // --- Saved captions state ---
  const [saved, setSaved] = useState<SavedCaption[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [savedError, setSavedError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ text: '', platform: '', notes: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // --- Live account captions state ---
  const [live, setLive] = useState<LiveCaption[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [liveFetched, setLiveFetched] = useState(false);

  // --- Shared UI state ---
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Instagram' | 'Facebook'>('All');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set()); // tracks which live captions were just saved

  // ── Fetch saved captions from DB ──
  const fetchSaved = async () => {
    setSavedLoading(true);
    setSavedError(null);
    try {
      const res = await fetch('/api/caption-bank/saved');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load saved captions');
      setSaved(data.captions || []);
    } catch (err) {
      setSavedError(err instanceof Error ? err.message : 'Failed to load captions');
    } finally {
      setSavedLoading(false);
    }
  };

  // ── Fetch live captions from Meta/IG ──
  const fetchLive = async () => {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const res = await fetch('/api/caption-bank');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load captions from accounts');
      setLive(data.captions || []);
      setLiveFetched(true);
    } catch (err) {
      setLiveError(err instanceof Error ? err.message : 'Failed to load captions');
    } finally {
      setLiveLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  // Load live captions when switching to accounts tab (lazy)
  useEffect(() => {
    if (tab === 'accounts' && !liveFetched) {
      fetchLive();
    }
  }, [tab]);

  // ── Add a caption manually ──
  const handleAddCaption = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.text.trim()) {
      setAddError('Caption text is required.');
      return;
    }
    setAddSaving(true);
    setAddError(null);
    try {
      const res = await fetch('/api/caption-bank/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: addForm.text,
          platform: addForm.platform || null,
          notes: addForm.notes || null,
          source: 'manual',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved((prev) => [data.caption, ...prev]);
      setAddForm({ text: '', platform: '', notes: '' });
      setShowAddForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setAddSaving(false);
    }
  };

  // ── Save a live caption to the bank ──
  const handleSaveToBank = async (caption: LiveCaption, uniqueKey: string) => {
    try {
      const res = await fetch('/api/caption-bank/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: caption.text,
          platform: caption.platform,
          source: caption.platform === 'Instagram' ? 'instagram' : 'facebook',
          original_date: caption.date,
          original_permalink: caption.permalink,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setSaved((prev) => [data.caption, ...prev]);
      setSavedKeys((prev) => new Set([...prev, uniqueKey]));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save caption');
    }
  };

  // ── Delete a saved caption ──
  const handleDelete = async (id: number) => {
    if (!window.confirm('Remove this caption from your bank?')) return;
    setDeletingId(id);
    try {
      await fetch(`/api/caption-bank/saved?id=${id}`, { method: 'DELETE' });
      setSaved((prev) => prev.filter((c) => c.id !== id));
    } catch {
      alert('Failed to delete caption');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Copy to clipboard ──
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // ── Filter helpers ──
  const filterSaved = (list: SavedCaption[]) =>
    list.filter((c) => {
      const matchPlatform = platformFilter === 'All' || c.platform === platformFilter;
      const matchSearch = !search || c.text.toLowerCase().includes(search.toLowerCase()) || (c.notes || '').toLowerCase().includes(search.toLowerCase());
      return matchPlatform && matchSearch;
    });

  const filterLive = (list: LiveCaption[]) =>
    list.filter((c) => {
      const matchPlatform = platformFilter === 'All' || c.platform === platformFilter;
      const matchSearch = !search || c.text.toLowerCase().includes(search.toLowerCase());
      return matchPlatform && matchSearch;
    });

  const filteredSaved = filterSaved(saved);
  const filteredLive = filterLive(live);

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Caption Bank</h1>
            <p className="text-sm text-gray-500 mt-1">
              Save captions you love and browse everything posted to your IG &amp; Facebook accounts.
            </p>
          </div>
          {tab === 'saved' && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Add Caption
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
          <button
            onClick={() => setTab('saved')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'saved'
                ? 'bg-white text-fm-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Bookmark className="w-4 h-4" />
              Saved ({saved.length})
            </span>
          </button>
          <button
            onClick={() => setTab('accounts')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              tab === 'accounts'
                ? 'bg-white text-fm-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              From Accounts {liveFetched ? `(${live.length})` : ''}
            </span>
          </button>
        </div>

        {/* Add Caption Form (Saved tab only) */}
        {tab === 'saved' && showAddForm && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Add Caption to Bank</h2>
              <button onClick={() => { setShowAddForm(false); setAddError(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddCaption} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={addForm.text}
                  onChange={(e) => setAddForm({ ...addForm, text: e.target.value })}
                  rows={5}
                  placeholder="Paste or write your caption here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                  <select
                    value={addForm.platform}
                    onChange={(e) => setAddForm({ ...addForm, platform: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 bg-white"
                  >
                    <option value="">Any / General</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="LinkedIn">LinkedIn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                  <input
                    type="text"
                    value={addForm.notes}
                    onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                    placeholder="e.g. Great for product launches"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 bg-white"
                  />
                </div>
              </div>
              {addError && (
                <p className="text-sm text-red-600">{addError}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={addSaving}
                  className="px-4 py-2 bg-fm-blue text-white rounded-md text-sm font-medium hover:bg-fm-navy transition-colors disabled:opacity-50"
                >
                  {addSaving ? 'Saving...' : 'Save to Bank'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setAddError(null); }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search captions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 bg-white"
            />
          </div>
          <div className="flex gap-2">
            {(['All', 'Instagram', 'Facebook'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlatformFilter(p)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  platformFilter === p
                    ? 'bg-fm-blue text-white'
                    : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {tab === 'accounts' && (
            <button
              onClick={fetchLive}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Refresh
            </button>
          )}
        </div>

        {/* ── SAVED TAB ────────────────────────────────────────────── */}
        {tab === 'saved' && (
          <>
            {savedLoading && (
              <div className="text-center py-16 text-gray-500">Loading saved captions...</div>
            )}
            {savedError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
                {savedError}
              </div>
            )}
            {!savedLoading && !savedError && filteredSaved.length === 0 && (
              <div className="text-center py-16">
                <Bookmark className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {saved.length === 0 ? 'No captions saved yet.' : 'No captions match your search.'}
                </p>
                {saved.length === 0 && (
                  <p className="text-sm text-gray-400 mt-1">
                    Add one manually or save from the "From Accounts" tab.
                  </p>
                )}
              </div>
            )}
            {!savedLoading && !savedError && filteredSaved.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Showing {filteredSaved.length} of {saved.length} saved captions
                </p>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Platform</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Source</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-36">Notes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredSaved.map((caption) => {
                        const copyKey = `saved-${caption.id}`;
                        return (
                          <tr key={caption.id} className="hover:bg-gray-50 align-top">
                            <td className="px-4 py-3">
                              <PlatformBadge platform={caption.platform} />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                              {caption.source}
                              {caption.original_date && (
                                <div className="text-gray-400 mt-0.5">{formatDate(caption.original_date)}</div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <p className="whitespace-pre-wrap line-clamp-4">{caption.text}</p>
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 italic">
                              {caption.notes || '—'}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopy(caption.text, copyKey)}
                                  title="Copy caption"
                                  className={`p-1.5 rounded transition-colors ${
                                    copiedKey === copyKey
                                      ? 'text-green-600 bg-green-50'
                                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {copiedKey === copyKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                {caption.original_permalink && (
                                  <a
                                    href={caption.original_permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View original post"
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDelete(caption.id)}
                                  disabled={deletingId === caption.id}
                                  title="Remove from bank"
                                  className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── FROM ACCOUNTS TAB ────────────────────────────────────── */}
        {tab === 'accounts' && (
          <>
            {!liveFetched && !liveLoading && (
              <div className="text-center py-16">
                <p className="text-gray-500">Loading captions from your Instagram and Facebook accounts...</p>
              </div>
            )}
            {liveLoading && (
              <div className="text-center py-16 text-gray-500">
                Fetching captions from your accounts...
              </div>
            )}
            {liveError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
                {liveError}
              </div>
            )}
            {!liveLoading && !liveError && liveFetched && filteredLive.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                {live.length === 0
                  ? 'No published captions found on your accounts.'
                  : 'No captions match your search.'}
              </div>
            )}
            {!liveLoading && !liveError && filteredLive.length > 0 && (
              <>
                <p className="text-xs text-gray-400 mb-3">
                  Showing {filteredLive.length} of {live.length} captions from your accounts. Click{' '}
                  <BookmarkCheck className="inline w-3.5 h-3.5" /> to save one to your bank.
                </p>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Platform</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Type</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Likes</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredLive.map((caption, i) => {
                        const uniqueKey = `${caption.platform}-${caption.date}-${i}`;
                        const wasSaved = savedKeys.has(uniqueKey);
                        const copyKey = `live-${i}`;
                        return (
                          <tr key={i} className="hover:bg-gray-50 align-top">
                            <td className="px-4 py-3">
                              <PlatformBadge platform={caption.platform} />
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(caption.date)}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 capitalize">
                              {caption.media_type?.toLowerCase()}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <p className="whitespace-pre-wrap line-clamp-4">{caption.text}</p>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {caption.likes.toLocaleString()}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCopy(caption.text, copyKey)}
                                  title="Copy caption"
                                  className={`p-1.5 rounded transition-colors ${
                                    copiedKey === copyKey
                                      ? 'text-green-600 bg-green-50'
                                      : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                                  }`}
                                >
                                  {copiedKey === copyKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                                {caption.permalink && (
                                  <a
                                    href={caption.permalink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="View original post"
                                    className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleSaveToBank(caption, uniqueKey)}
                                  disabled={wasSaved}
                                  title={wasSaved ? 'Saved to bank' : 'Save to bank'}
                                  className={`p-1.5 rounded transition-colors ${
                                    wasSaved
                                      ? 'text-fm-blue bg-blue-50 cursor-default'
                                      : 'text-gray-400 hover:text-fm-blue hover:bg-blue-50'
                                  }`}
                                >
                                  {wasSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
