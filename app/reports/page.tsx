'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { Upload, ExternalLink, ChevronUp, ChevronDown, BarChart3, Instagram, Facebook } from 'lucide-react';

interface PostAnalytics {
  id: number;
  post_id: string;
  platform: string;
  post_type: string;
  account_name: string;
  description: string;
  publish_time: string;
  permalink: string;
  report_month: string;
  views: number;
  reach: number;
  likes: number;
  comments_count: number;
  shares: number;
  saves: number;
  follows: number;
  reactions: number;
  total_clicks: number;
  duration_sec: number;
  seconds_viewed: number;
  avg_seconds_viewed: number;
}

type SortKey = keyof PostAnalytics;
type SortDir = 'asc' | 'desc';

// ── CSV format detection ──────────────────────────────────────────────────────
type CsvFormat = 'ig_posts' | 'fb_video' | 'fb_posts' | 'unknown';

const detectFormat = (headers: string[]): CsvFormat => {
  const h = new Set(headers);
  if (h.has('Account username') && h.has('Saves')) return 'ig_posts';
  if (h.has('Video asset ID') && h.has('3-second video views')) return 'fb_video';
  if (h.has('Page ID') && h.has('Total clicks')) return 'fb_posts';
  return 'unknown';
};

// Parse a Meta publish time string "MM/DD/YYYY HH:mm" to ISO
const parsePublishTime = (raw: string): string | null => {
  if (!raw) return null;
  // "02/03/2026 14:23" → "2026-02-03T14:23:00"
  const m = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!m) return null;
  return `${m[3]}-${m[1]}-${m[2]}T${m[4]}:${m[5]}:00`;
};

// First day of the month for grouping
const reportMonth = (publishIso: string | null): string | null => {
  if (!publishIso) return null;
  return publishIso.substring(0, 7) + '-01';
};

const safeInt = (v: any): number => {
  const n = parseInt(String(v ?? '0').replace(/,/g, ''), 10);
  return isNaN(n) ? 0 : n;
};

const safeFloat = (v: any): number => {
  const n = parseFloat(String(v ?? '0').replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
};

// ── Transform CSV rows to PostAnalytics insert shape ─────────────────────────
function transformIgPosts(rows: any[]): any[] {
  return rows.map((r) => {
    const pt = parsePublishTime(r['Publish time']);
    return {
      post_id: String(r['Post ID'] || ''),
      platform: 'instagram',
      post_type: r['Post type'] || '',
      account_name: r['Account name'] || r['Account username'] || '',
      description: r['Description'] || '',
      publish_time: pt,
      permalink: r['Permalink'] || '',
      report_month: reportMonth(pt),
      views: safeInt(r['Views']),
      reach: safeInt(r['Reach']),
      likes: safeInt(r['Likes']),
      comments_count: safeInt(r['Comments']),
      shares: safeInt(r['Shares']),
      saves: safeInt(r['Saves']),
      follows: safeInt(r['Follows']),
      reactions: 0,
      total_clicks: 0,
      duration_sec: safeInt(r['Duration (sec)']),
      seconds_viewed: 0,
      avg_seconds_viewed: 0,
    };
  });
}

function transformFbPosts(rows: any[]): any[] {
  return rows.map((r) => {
    const pt = parsePublishTime(r['Publish time']);
    return {
      post_id: String(r['Post ID'] || ''),
      platform: 'facebook',
      post_type: r['Post type'] || '',
      account_name: r['Page name'] || '',
      description: r['Description'] || r['Title'] || '',
      publish_time: pt,
      permalink: r['Permalink'] || '',
      report_month: reportMonth(pt),
      views: safeInt(r['Views']),
      reach: safeInt(r['Reach']),
      likes: safeInt(r['Reactions']),
      comments_count: safeInt(r['Comments']),
      shares: safeInt(r['Shares']),
      saves: 0,
      follows: 0,
      reactions: safeInt(r['Reactions, Comments and Shares'] || r['Reactions']),
      total_clicks: safeInt(r['Total clicks']),
      duration_sec: safeInt(r['Duration (sec)']),
      seconds_viewed: safeFloat(r['Seconds viewed']),
      avg_seconds_viewed: safeFloat(r['Average Seconds viewed']),
    };
  });
}

function transformFbVideo(rows: any[]): any[] {
  return rows.map((r) => {
    const pt = parsePublishTime(r['Publish time']);
    return {
      post_id: String(r['Video asset ID'] || r['Universal video ID'] || ''),
      platform: 'facebook',
      post_type: 'FB video',
      account_name: r['Page name'] || '',
      description: r['Title'] || '',
      publish_time: pt,
      permalink: '',
      report_month: reportMonth(pt),
      views: safeInt(r['3-second video views']),
      reach: safeInt(r['Reach']),
      likes: safeInt(r['Reactions']),
      comments_count: safeInt(r['Comments']),
      shares: safeInt(r['Shares']),
      saves: 0,
      follows: 0,
      reactions: safeInt(r['Reactions, Comments and Shares']),
      total_clicks: 0,
      duration_sec: safeInt(r['Duration (sec)']),
      seconds_viewed: safeFloat(r['Seconds viewed']),
      avg_seconds_viewed: safeFloat(r['Average Seconds viewed']),
    };
  });
}

// ── Metric cell helper — coerce to Number since Postgres returns DECIMAL as string ──
const Num = ({ v, dash = false }: { v: any; dash?: boolean }) => {
  const n = Number(v ?? 0);
  return (dash && n === 0) ? <span className="text-gray-300">—</span> : <>{n.toLocaleString()}</>;
};

// ── Sort icon ────────────────────────────────────────────────────────────────
const SortIcon = ({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (col !== sortKey) return <ChevronUp className="w-3 h-3 text-gray-300" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3 h-3 text-fm-blue" />
    : <ChevronDown className="w-3 h-3 text-fm-blue" />;
};

// ── Platform icon ─────────────────────────────────────────────────────────────
const PlatformIcon = ({ platform }: { platform: string }) =>
  platform === 'instagram'
    ? <Instagram className="w-3.5 h-3.5 text-rose-500" />
    : <Facebook className="w-3.5 h-3.5 text-blue-600" />;

const FORMAT_LABELS: Record<CsvFormat, string> = {
  ig_posts: 'Instagram Posts',
  fb_video: 'Facebook Video Detail',
  fb_posts: 'Facebook Posts',
  unknown: 'Unknown Format',
};

export default function ReportsPage() {
  const [posts, setPosts] = useState<PostAnalytics[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('publish_time');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<CsvFormat | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchPosts = async (month = selectedMonth, platform = selectedPlatform) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (month) params.set('month', month);
      if (platform) params.set('platform', platform);
      const res = await fetch(`/api/post-analytics?${params}`);
      const data = await res.json();
      setPosts(data.posts || []);
      setMonths(data.months || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleMonthChange = (m: string) => {
    setSelectedMonth(m);
    fetchPosts(m, selectedPlatform);
  };

  const handlePlatformChange = (p: string) => {
    setSelectedPlatform(p);
    fetchPosts(selectedMonth, p);
  };

  // Parse a single File → array of rows ready for the API
  const parseFile = (file: File): Promise<{ format: CsvFormat; rows: any[] }> =>
    new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const headers = result.meta.fields || [];
          const fmt = detectFormat(headers);
          if (fmt === 'unknown') { resolve({ format: fmt, rows: [] }); return; }

          let transformed: any[] = [];
          if (fmt === 'ig_posts') transformed = transformIgPosts(result.data as any[]);
          else if (fmt === 'fb_posts') transformed = transformFbPosts(result.data as any[]);
          else if (fmt === 'fb_video') transformed = transformFbVideo(result.data as any[]);
          transformed = transformed.filter((r) => r.post_id && r.post_id !== 'undefined');
          resolve({ format: fmt, rows: transformed });
        },
        error: () => reject(new Error('Could not parse CSV file.')),
      });
    });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadMsg(null);
    setDetectedFormat(null);
    setUploading(true);

    let totalInserted = 0;
    let totalUpdated = 0;
    const errors: string[] = [];
    const formats = new Set<CsvFormat>();

    try {
      for (const file of files) {
        let parsed: { format: CsvFormat; rows: any[] };
        try {
          parsed = await parseFile(file);
        } catch {
          errors.push(`"${file.name}": could not parse`);
          continue;
        }
        formats.add(parsed.format);

        if (parsed.format === 'unknown' || parsed.rows.length === 0) {
          errors.push(`"${file.name}": unknown format or no valid rows`);
          continue;
        }

        const res = await fetch('/api/post-analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rows: parsed.rows }),
        });
        const data = await res.json();
        if (res.ok) {
          totalInserted += data.inserted || 0;
          totalUpdated += data.updated || 0;
        } else {
          errors.push(`"${file.name}": ${data.error || 'upload failed'}`);
        }
      }

      // Show detected formats
      const fmtLabels = Array.from(formats).filter(f => f !== 'unknown').map(f => FORMAT_LABELS[f]);
      if (fmtLabels.length) setDetectedFormat(Array.from(formats).find(f => f !== 'unknown') || null);

      if (totalInserted > 0 || totalUpdated > 0) {
        const msg = `Imported ${files.length} file${files.length > 1 ? 's' : ''}: ${totalInserted} new, ${totalUpdated} updated${errors.length ? ` (${errors.length} error${errors.length > 1 ? 's' : ''})` : ''}`;
        setUploadMsg({ type: 'success', text: msg });
        await fetchPosts(selectedMonth, selectedPlatform);
      } else {
        setUploadMsg({ type: 'error', text: errors.length > 0 ? errors.join(' · ') : 'No rows imported.' });
      }
    } catch {
      setUploadMsg({ type: 'error', text: 'Unexpected error during upload.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // Sort — Number() coerce since Postgres returns DECIMAL/INTEGER as strings
  const sorted = [...posts].sort((a, b) => {
    const av = Number(a[sortKey] ?? 0);
    const bv = Number(b[sortKey] ?? 0);
    // Fall back to string compare for non-numeric fields (e.g. publish_time, post_type)
    const as = String(a[sortKey] ?? '');
    const bs = String(b[sortKey] ?? '');
    const cmp = isNaN(av) || isNaN(bv) ? as.localeCompare(bs) : av - bv;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  // Summary totals — coerce to Number for same reason
  const totals = posts.reduce(
    (acc, p) => ({
      views: acc.views + Number(p.views || 0),
      reach: acc.reach + Number(p.reach || 0),
      likes: acc.likes + Number(p.likes || 0),
      comments_count: acc.comments_count + Number(p.comments_count || 0),
      shares: acc.shares + Number(p.shares || 0),
      saves: acc.saves + Number(p.saves || 0),
    }),
    { views: 0, reach: 0, likes: 0, comments_count: 0, shares: 0, saves: 0 }
  );

  const ThBtn = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 whitespace-nowrap"
      onClick={() => handleSort(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-fm-blue" />
                Performance Reports
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Upload monthly Meta CSV exports to track post performance
              </p>
            </div>

            {/* Upload area */}
            <div className="flex flex-col items-end gap-2">
              <label className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors ${
                uploading
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-fm-blue text-white hover:bg-fm-navy'
              }`}>
                <Upload className="w-4 h-4" />
                {uploading ? 'Importing…' : 'Upload CSV'}
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
              {detectedFormat && (
                <span className="text-xs text-gray-500">
                  Detected: <span className="font-medium text-fm-blue">{FORMAT_LABELS[detectedFormat]}</span>
                </span>
              )}
              {uploadMsg && (
                <span className={`text-xs ${uploadMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {uploadMsg.text}
                </span>
              )}
              <p className="text-xs text-gray-400 max-w-xs text-right">
                Select multiple CSVs at once (IG Posts, FB Posts, FB Video Detail)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
            >
              <option value="">All months</option>
              {months.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => handlePlatformChange(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
            >
              <option value="">All platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
            </select>
          </div>
          <span className="text-sm text-gray-500 ml-auto">{posts.length} post{posts.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Summary totals */}
        {posts.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: 'Total Views', value: totals.views },
              { label: 'Total Reach', value: totals.reach },
              { label: 'Total Likes', value: totals.likes },
              { label: 'Total Comments', value: totals.comments_count },
              { label: 'Total Shares', value: totals.shares },
              { label: 'Total Saves', value: totals.saves },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-lg p-3 shadow-sm text-center">
                <div className="text-lg font-bold text-fm-navy">{value.toLocaleString()}</div>
                <div className="text-xs text-gray-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-700 mb-1">No performance data yet</h3>
            <p className="text-sm text-gray-500">
              Download your monthly CSV from Meta Business Suite and upload it above.
              Supported formats: Instagram posts export, Facebook posts export, and Facebook video detail export.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                    <ThBtn col="publish_time" label="Date" />
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">Caption</th>
                    <ThBtn col="views" label="Views" />
                    <ThBtn col="reach" label="Reach" />
                    <ThBtn col="likes" label="Likes" />
                    <ThBtn col="comments_count" label="Comments" />
                    <ThBtn col="shares" label="Shares" />
                    <ThBtn col="saves" label="Saves" />
                    <ThBtn col="avg_seconds_viewed" label="Avg Watch" />
                    <th className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sorted.map((post) => (
                    <tr key={post.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <PlatformIcon platform={post.platform} />
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-gray-700">
                        {post.publish_time
                          ? format(new Date(post.publish_time), 'MMM d, yyyy')
                          : '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          post.post_type?.toLowerCase().includes('reel') ? 'bg-rose-100 text-rose-800' :
                          post.post_type?.toLowerCase().includes('carousel') ? 'bg-cyan-100 text-cyan-800' :
                          post.post_type?.toLowerCase().includes('video') ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {post.post_type || '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3 max-w-xs">
                        <p className="line-clamp-2 text-xs text-gray-700 leading-relaxed">
                          {post.description || '—'}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-800 font-medium whitespace-nowrap">
                        <Num v={post.views} />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                        <Num v={post.reach} />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                        <Num v={post.likes} />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                        <Num v={post.comments_count} />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                        <Num v={post.shares} />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                        <Num v={post.saves} dash={post.platform === 'facebook'} />
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700 whitespace-nowrap">
                        {Number(post.avg_seconds_viewed) > 0
                          ? `${Number(post.avg_seconds_viewed).toFixed(1)}s`
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {post.permalink ? (
                          <a
                            href={post.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-fm-blue hover:text-fm-navy"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
