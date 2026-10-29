'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { ArrowLeft, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';

// ── Column matching ───────────────────────────────────────────────────
// Header names are matched loosely so a sheet copied straight from Google Sheets works.
const COLUMN_ALIASES: Record<string, string[]> = {
  post_date: ['date', 'post date', 'post_date', 'day'],
  platforms: ['platform', 'platforms', 'channel', 'channels'],
  content_type: ['type', 'content type', 'content_type', 'format'],
  content_needs: ['topic', 'content needs', 'content_needs', 'description', 'idea'],
  caption: ['caption', 'copy', 'captions'],
  asset_link: ['link', 'links', 'asset', 'asset link', 'asset_link', 'drive', 'drive link', 'assets', 'carousel links'],
  status: ['status'],
  assigned_to: ['assigned', 'assigned to', 'assigned_to', 'owner'],
};

const PLATFORM_MAP: Record<string, string> = {
  instagram: 'Instagram', ig: 'Instagram',
  facebook: 'Facebook', fb: 'Facebook',
  linkedin: 'LinkedIn', li: 'LinkedIn',
};

const TYPE_MAP: Record<string, string> = {
  post: 'Post', static: 'Post', image: 'Post', graphic: 'Post',
  carousel: 'Carousel',
  reel: 'Reel', video: 'Reel',
  story: 'Story', stories: 'Story',
};

const STATUS_MAP: Record<string, string> = {
  draft: 'draft',
  paused: 'paused',
  'ready for approval': 'ready_for_approval', ready: 'ready_for_approval', ready_for_approval: 'ready_for_approval',
  'needs edits': 'needs_edits', needs_edits: 'needs_edits',
  approved: 'approved',
  scheduled: 'scheduled',
  posted: 'posted',
};

interface ParsedRow {
  post_date: string;
  platforms: string[];
  content_type: string;
  content_needs: string;
  caption: string;
  asset_link: string;
  status: string;
  assigned_to: string;
  errors: string[];
}

const pad = (n: number) => String(n).padStart(2, '0');

// Accepts 2026-11-03, 11/3/2026, 11/3/26, or 11/3 (uses defaultYear)
const parseDate = (raw: string, defaultYear: number): string | null => {
  const s = raw.trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (m) {
    const year = m[3] ? (m[3].length === 2 ? 2000 + +m[3] : +m[3]) : defaultYear;
    return `${year}-${pad(+m[1])}-${pad(+m[2])}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime()) && /[a-z]/i.test(s)) {
    const year = /\d{4}/.test(s) ? d.getFullYear() : defaultYear;
    return `${year}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }
  return null;
};

const parsePaste = (text: string, defaultYear: number): { rows: ParsedRow[]; unmatched: string[] } => {
  const delimiter = text.includes('\t') ? '\t' : ',';
  const parsed = Papa.parse<string[]>(text.trim(), { delimiter, skipEmptyLines: true });
  const [header, ...body] = parsed.data;
  if (!header) return { rows: [], unmatched: [] };

  const colIndex: Record<string, number> = {};
  const unmatched: string[] = [];
  header.forEach((h, i) => {
    const key = h.trim().toLowerCase();
    const field = Object.keys(COLUMN_ALIASES).find((f) => COLUMN_ALIASES[f].includes(key));
    if (field && colIndex[field] === undefined) colIndex[field] = i;
    else if (key) unmatched.push(h.trim());
  });

  const cell = (r: string[], field: string) => (colIndex[field] !== undefined ? (r[colIndex[field]] ?? '').trim() : '');

  const rows = body.map((r) => {
    const errors: string[] = [];

    const rawDate = cell(r, 'post_date');
    const post_date = parseDate(rawDate, defaultYear) ?? '';
    if (!post_date) errors.push(rawDate ? `Unrecognized date "${rawDate}"` : 'Missing date');

    const rawPlatforms = cell(r, 'platforms');
    const platforms = rawPlatforms
      ? rawPlatforms.split(/[,/&+]|\band\b/i).map((p) => p.trim().toLowerCase()).filter(Boolean).map((p) => {
          const mapped = PLATFORM_MAP[p];
          if (!mapped) errors.push(`Unknown platform "${p}"`);
          return mapped;
        }).filter(Boolean)
      : ['Instagram'];

    const rawType = cell(r, 'content_type').toLowerCase();
    const content_type = rawType ? TYPE_MAP[rawType] ?? '' : 'Post';
    if (!content_type) errors.push(`Unknown type "${rawType}"`);

    const rawStatus = cell(r, 'status').toLowerCase();
    const status = rawStatus ? STATUS_MAP[rawStatus] ?? '' : 'draft';
    if (!status) errors.push(`Unknown status "${rawStatus}"`);

    // Carousel links can be comma- or newline-separated; store one per line
    const asset_link = cell(r, 'asset_link').split(/[\n,]/).map((s) => s.trim()).filter(Boolean).join('\n');

    return {
      post_date,
      platforms: Array.from(new Set(platforms)),
      content_type,
      content_needs: cell(r, 'content_needs'),
      caption: cell(r, 'caption'),
      asset_link,
      status,
      assigned_to: cell(r, 'assigned_to') || 'Emily',
      errors,
    };
  });

  return { rows, unmatched };
};

export default function BulkImportPage() {
  const [text, setText] = useState('');
  const [defaultYear, setDefaultYear] = useState(new Date().getFullYear());
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { rows, unmatched } = useMemo(() => parsePaste(text, defaultYear), [text, defaultYear]);
  const errorCount = rows.filter((r) => r.errors.length > 0).length;
  const postCount = rows.reduce((n, r) => n + r.platforms.length, 0);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);
    try {
      const res = await fetch('/api/social-content/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: rows.map(({ errors, ...p }) => p) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ ok: false, message: [data.error, ...(data.details || [])].join(' · ') });
      } else {
        setResult({ ok: true, message: data.message });
        setText('');
      }
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : 'Import failed' });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/social-calendar" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Social Calendar
        </Link>

        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Content</h1>
        <p className="text-sm text-gray-600 mt-1">
          Paste rows from Google Sheets (or CSV) with a header row. Existing posts are never changed — new rows are always added alongside them.
        </p>

        <div className="mt-6 bg-white rounded-lg shadow p-4 space-y-3">
          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <span className="font-semibold">Columns:</span> Date, Platform, Type, Topic, Caption, Links, Status, Assigned To.
              Only Date is required; Platform defaults to Instagram, Type to Post, Status to Draft.
            </p>
            <p>
              Platforms can be combined (<code>Instagram, Facebook</code>) — one post per platform is created, linked together.
              Carousel links can be comma- or line-separated.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <label htmlFor="year" className="text-gray-700">Year for dates without one:</label>
            <input
              id="year"
              type="number"
              value={defaultYear}
              onChange={(e) => setDefaultYear(Number(e.target.value))}
              className="w-24 px-2 py-1 border border-gray-300 rounded-md text-gray-900"
            />
          </div>

          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); setResult(null); }}
            rows={8}
            placeholder={'Date\tPlatform\tType\tTopic\tCaption\tLinks\tStatus\n11/3\tInstagram, Facebook\tCarousel\tFounder myths\tCaption here...\thttps://drive.google.com/..., https://drive.google.com/...\tDraft'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400 font-mono text-xs"
          />

          {unmatched.length > 0 && (
            <p className="text-xs text-amber-700">Ignored columns: {unmatched.join(', ')}</p>
          )}
        </div>

        {rows.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">{rows.length}</span> rows → <span className="font-semibold">{postCount}</span> posts
                {errorCount > 0 && <span className="text-red-600 ml-2">· {errorCount} row{errorCount > 1 ? 's' : ''} need fixing</span>}
              </p>
              <button
                onClick={handleImport}
                disabled={importing || errorCount > 0}
                className="flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {importing ? 'Importing...' : `Import ${postCount} Posts`}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-50 text-gray-600 text-left">
                  <tr>
                    {['Date', 'Platforms', 'Type', 'Topic', 'Caption', 'Links', 'Status', ''].map((h) => (
                      <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-gray-900">
                  {rows.map((r, i) => (
                    <tr key={i} className={r.errors.length ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap">{r.post_date || '—'}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{r.platforms.join(', ')}</td>
                      <td className="px-3 py-2">{r.content_type}</td>
                      <td className="px-3 py-2 max-w-[12rem] truncate" title={r.content_needs}>{r.content_needs}</td>
                      <td className="px-3 py-2 max-w-[20rem] truncate" title={r.caption}>{r.caption}</td>
                      <td className="px-3 py-2">{r.asset_link ? `${r.asset_link.split('\n').length} link(s)` : '—'}</td>
                      <td className="px-3 py-2">{r.status}</td>
                      <td className="px-3 py-2 text-red-600">{r.errors.join('; ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {result && (
          <div className={`mt-4 flex items-start gap-2 px-4 py-3 rounded-md text-sm border ${
            result.ok ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {result.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertCircle className="w-4 h-4 mt-0.5" />}
            <span>
              {result.message}
              {result.ok && <> — <Link href="/social-calendar" className="underline">view calendar</Link></>}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
