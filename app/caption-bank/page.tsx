'use client';

import { useState, useEffect } from 'react';
import { Copy, ExternalLink, Search, Instagram, Facebook } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface Caption {
  platform: string;
  text: string;
  date: string;
  media_type: string;
  permalink: string | null;
  likes: number;
}

export default function CaptionBankPage() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Instagram' | 'Facebook'>('All');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchCaptions();
  }, []);

  const fetchCaptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/caption-bank');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load captions');
      setCaptions(data.captions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load captions');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(index);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const filtered = captions.filter((c) => {
    const matchesPlatform = platformFilter === 'All' || c.platform === platformFilter;
    const matchesSearch = search === '' || c.text.toLowerCase().includes(search.toLowerCase());
    return matchesPlatform && matchesSearch;
  });

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const platformBadge = (platform: string) => {
    if (platform === 'Instagram') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-pink-100 text-pink-700">
          <Instagram className="w-3 h-3" /> Instagram
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
        <Facebook className="w-3 h-3" /> Facebook
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Caption Bank</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse published captions from your Instagram and Facebook accounts to reuse or inspire new content.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
          <button
            onClick={fetchCaptions}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Content */}
        {loading && (
          <div className="text-center py-16 text-gray-500">
            Loading captions from your accounts...
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            {captions.length === 0
              ? 'No published captions found on your accounts.'
              : 'No captions match your search.'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <p className="text-xs text-gray-400 mb-3">
              Showing {filtered.length} of {captions.length} captions
            </p>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Platform</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Caption</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Likes</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((caption, i) => (
                    <tr key={i} className="hover:bg-gray-50 align-top">
                      <td className="px-4 py-3">{platformBadge(caption.platform)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatDate(caption.date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 capitalize">{caption.media_type?.toLowerCase()}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <p className="whitespace-pre-wrap line-clamp-4">{caption.text}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{caption.likes.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(caption.text, i)}
                            title="Copy caption"
                            className={`p-1.5 rounded transition-colors ${
                              copiedId === i
                                ? 'text-green-600 bg-green-50'
                                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            <Copy className="w-4 h-4" />
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
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
