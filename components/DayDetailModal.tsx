'use client';

import { useState } from 'react';
import { X, Edit2, MessageCircle, Copy, Trash2, ExternalLink } from 'lucide-react';
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
const getTypeColor = (type: string): string => {
  switch (type) {
    case 'Post':     return 'bg-violet-100 text-violet-800';
    case 'Reel':     return 'bg-rose-100 text-rose-800';
    case 'Story':    return 'bg-amber-100 text-amber-800';
    case 'Carousel': return 'bg-cyan-100 text-cyan-800';
    default:         return 'bg-slate-100 text-slate-700';
  }
};

// ── Asset preview detection ───────────────────────────────────────────
type AssetPreview =
  | { type: 'gdrive'; src: string }
  | { type: 'image'; src: string }
  | { type: 'canva' }
  | null;

const getAssetPreview = (url: string): AssetPreview => {
  if (!url) return null;
  // Google Drive — extract file ID from /file/d/{id}/ pattern
  const gdriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (gdriveMatch) {
    return { type: 'gdrive', src: `https://drive.google.com/thumbnail?id=${gdriveMatch[1]}&sz=w400` };
  }
  // Direct image URL
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url)) {
    return { type: 'image', src: url };
  }
  // Canva
  if (url.includes('canva.com')) {
    return { type: 'canva' };
  }
  return null;
};

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
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
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(item.content_type)}`}>
                          {item.content_type || '—'}
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

                        {/* Image preview for Google Drive / direct image URLs */}
                        {(assetPreview?.type === 'gdrive' || assetPreview?.type === 'image') && (
                          <div className="mb-1.5">
                            <img
                              src={assetPreview.src}
                              alt="Asset preview"
                              className="w-full max-h-48 object-contain rounded-md border border-gray-200 bg-gray-100"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        )}

                        <a
                          href={item.asset_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-fm-blue hover:text-fm-navy underline"
                        >
                          {assetPreview?.type === 'canva' ? '🎨 View in Canva' : 'View Asset'}
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
