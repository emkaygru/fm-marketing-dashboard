'use client';

import { useState } from 'react';
import { X, Edit2, MessageCircle, Copy, Trash2, ExternalLink, ChevronLeft, ChevronRight, Link } from 'lucide-react';
import { format } from 'date-fns';
import StatusBadge from './StatusBadge';

interface ContentItem {
  id: number;
  post_date: string;
  content_type: string;
  platform: string;
  content_needs: string;
  asset_link: string;
  caption: string;
  status: string;
  assigned_to: string;
}

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  content: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDuplicate: (item: ContentItem) => void;
  onComment: (item: ContentItem) => void;
  onCommentWithContext?: (item: ContentItem, context: string) => void;
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onAddContent: () => void;
}

// ── Type badge colors ─────────────────────────────────────────────────
const getTypeColor = (type: string, assignedTo?: string): string => {
  if (assignedTo === 'Beth') return 'bg-teal-100 text-teal-800';
  switch (type) {
    case 'Post':     return 'bg-violet-100 text-violet-800';
    case 'Reel':     return 'bg-rose-100 text-rose-800';
    case 'Story':    return 'bg-amber-100 text-amber-800';
    case 'Carousel': return 'bg-cyan-100 text-cyan-800';
    default:         return 'bg-slate-100 text-slate-700';
  }
};

const getTypeLabel = (type: string, assignedTo?: string): string => {
  if (assignedTo === 'Beth') return `${(type || '?').charAt(0)} BETH`;
  return type || '—';
};

// ── Asset preview detection ───────────────────────────────────────────
type AssetPreview =
  | { type: 'gdrive'; src: string }
  | { type: 'image'; src: string }
  | { type: 'canva' }
  | null;

/** Extract a Google Drive thumbnail URL from any Drive file link */
const gdriveThumbnail = (url: string): string | null => {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400` : null;
};

const getAssetPreview = (url: string): AssetPreview => {
  if (!url) return null;
  const thumb = gdriveThumbnail(url);
  if (thumb) return { type: 'gdrive', src: thumb };
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return { type: 'image', src: url };
  if (url.includes('canva.com')) return { type: 'canva' };
  return null;
};

/** Parse a carousel asset_link (newline or comma-separated Drive URLs) into thumbnail URLs */
const getCarouselImages = (assetLink: string): string[] => {
  if (!assetLink) return [];
  return assetLink
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((url) => {
      const thumb = gdriveThumbnail(url);
      if (thumb) return thumb;
      if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) return url;
      return null;
    })
    .filter(Boolean) as string[];
};

// ── Drive image with graceful fallback ────────────────────────────────
function DriveImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-md gap-1.5 py-6 ${className ?? ''}`}>
        <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-xs text-gray-400">Preview unavailable — open link to view</span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className ?? 'w-full max-h-48 object-contain rounded-md border border-gray-200 bg-gray-100'}
      onError={() => setFailed(true)}
    />
  );
}

// ── Carousel slide viewer ─────────────────────────────────────────────
function CarouselPreview({ images, folderUrl }: { images: string[]; folderUrl: string }) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);
  return (
    <div className="relative mb-1.5">
      <DriveImage
        key={images[idx]}
        src={images[idx]}
        alt={`Slide ${idx + 1} of ${images.length}`}
        className="w-full max-h-64 object-contain rounded-md border border-gray-200 bg-gray-100"
      />
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={next}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">
            {idx + 1} / {images.length}
          </span>
          {/* Dot indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? 'bg-white' : 'bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DayDetailModal({
  isOpen,
  onClose,
  date,
  content,
  onEdit,
  onDuplicate,
  onComment,
  onCommentWithContext,
  onDelete,
  onStatusChange,
  onAddContent,
}: DayDetailModalProps) {
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    const url = `${window.location.origin}/social-calendar?date=${dateStr}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDeleteClick = (id: number, isLastItem: boolean) => {
    if (confirmingDeleteId === id) {
      setConfirmingDeleteId(null);
      onDelete(id);
      if (isLastItem) onClose();
    } else {
      setConfirmingDeleteId(id);
      setTimeout(() => setConfirmingDeleteId((prev) => (prev === id ? null : prev)), 3000);
    }
  };

  if (!isOpen || !date) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {content.length} {content.length === 1 ? 'post' : 'posts'} scheduled
            </p>
          </div>
          <div className="flex items-center gap-1">
            {/* Copy shareable link */}
            <button
              onClick={handleCopyLink}
              title="Copy link to this day"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                copied
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Share'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {content.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No content scheduled for this day</p>
              <button
                onClick={() => { onAddContent(); onClose(); }}
                className="px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors"
              >
                Add Content
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => {
                const assetPreview = item.asset_link ? getAssetPreview(item.asset_link) : null;

                return (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-fm-blue transition-colors"
                  >
                    {/* Post header: type badge + platform + status */}
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(item.content_type, item.assigned_to)}`}>
                          {getTypeLabel(item.content_type, item.assigned_to)}
                        </span>
                        <span className="font-medium text-gray-900 text-sm">{item.platform}</span>
                        <span className="text-xs text-gray-500">· {item.assigned_to}</span>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>

                    {/* Topic */}
                    {item.content_needs && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Topic</p>
                        <p className="text-sm text-gray-700">{item.content_needs}</p>
                      </div>
                    )}

                    {/* Caption — full text, no clamp */}
                    {item.caption && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Caption</p>
                          {onCommentWithContext && (
                            <button
                              onClick={() => { onCommentWithContext(item, 'Caption'); onClose(); }}
                              title="Comment on caption"
                              className="p-0.5 text-gray-400 hover:text-violet-600 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{item.caption}</p>
                      </div>
                    )}

                    {/* Asset */}
                    {item.asset_link && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Asset</p>
                          {onCommentWithContext && (
                            <button
                              onClick={() => { onCommentWithContext(item, 'Asset'); onClose(); }}
                              title="Comment on asset"
                              className="p-0.5 text-gray-400 hover:text-amber-600 transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Carousel: multi-image slide viewer */}
                        {item.content_type === 'Carousel' ? (
                          <CarouselPreview
                            images={getCarouselImages(item.asset_link)}
                            folderUrl={item.asset_link}
                          />
                        ) : (assetPreview?.type === 'gdrive' || assetPreview?.type === 'image') ? (
                          /* Single image preview for Google Drive / direct image URLs */
                          <div className="mb-1.5">
                            <DriveImage
                              src={assetPreview.src}
                              alt="Asset preview"
                            />
                          </div>
                        ) : null}

                        <a
                          href={item.asset_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-fm-blue hover:text-fm-navy underline"
                        >
                          {assetPreview?.type === 'canva' ? '🎨 View in Canva' : item.content_type === 'Carousel' ? 'View Folder' : 'View Asset'}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {/* Status Changer */}
                    <div className="mb-3">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Status
                      </label>
                      <select
                        value={item.status}
                        onChange={(e) => onStatusChange(item.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 bg-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="paused">Paused</option>
                        <option value="ready_for_approval">Ready for Approval</option>
                        <option value="needs_edits">Needs Edits</option>
                        <option value="approved">Approved</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="posted">Posted</option>
                      </select>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center flex-wrap gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => { onComment(item); onClose(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Comment
                      </button>
                      <button
                        onClick={() => { onEdit(item); onClose(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => { onDuplicate(item); onClose(); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                        Duplicate
                      </button>
                      <button
                        onClick={() => handleDeleteClick(item.id, content.length === 1)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition-colors ml-auto ${
                          confirmingDeleteId === item.id
                            ? 'bg-red-600 text-white border border-red-600 hover:bg-red-700'
                            : 'text-red-600 bg-white border border-red-300 hover:bg-red-50'
                        }`}
                      >
                        <Trash2 className="w-4 h-4" />
                        {confirmingDeleteId === item.id ? 'Confirm delete?' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {content.length > 0 && (
          <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
            <button
              onClick={() => { onAddContent(); onClose(); }}
              className="w-full px-4 py-2 text-sm font-medium text-fm-blue bg-white border border-fm-blue rounded-md hover:bg-fm-blue hover:text-white transition-colors"
            >
              Add Another Post for This Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
