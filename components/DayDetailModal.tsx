'use client';

import { useState } from 'react';
import { X, Edit2, MessageCircle, Copy, Trash2 } from 'lucide-react';
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
  onDelete: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onAddContent: () => void;
}

export default function DayDetailModal({
  isOpen,
  onClose,
  date,
  content,
  onEdit,
  onDuplicate,
  onComment,
  onDelete,
  onStatusChange,
  onAddContent,
}: DayDetailModalProps) {
  if (!isOpen || !date) return null;

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'Post':
        return '📸';
      case 'Reel':
        return '🎬';
      case 'Story':
        return '📖';
      default:
        return '📄';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {format(date, 'EEEE, MMMM d, yyyy')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {content.length} {content.length === 1 ? 'post' : 'posts'} scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6">
          {content.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No content scheduled for this day</p>
              <button
                onClick={() => {
                  onAddContent();
                  onClose();
                }}
                className="px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors"
              >
                Add Content
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {content.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-fm-blue transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getContentTypeIcon(item.content_type)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{item.platform}</span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{item.content_type}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Assigned to: {item.assigned_to}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {item.content_needs && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Topic:</p>
                      <p className="text-sm text-gray-600">{item.content_needs}</p>
                    </div>
                  )}

                  {item.caption && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Caption:</p>
                      <p className="text-sm text-gray-600 line-clamp-3">{item.caption}</p>
                    </div>
                  )}

                  {item.asset_link && (
                    <div className="mb-3">
                      <a
                        href={item.asset_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-fm-blue hover:text-fm-navy underline"
                      >
                        View Asset →
                      </a>
                    </div>
                  )}

                  {/* Status Changer */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Change Status:
                    </label>
                    <select
                      value={item.status}
                      onChange={(e) => {
                        onStatusChange(item.id, e.target.value);
                      }}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
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
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => {
                        onComment(item);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Comment
                    </button>
                    <button
                      onClick={() => {
                        onEdit(item);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDuplicate(item);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      Duplicate
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this content?')) {
                          onDelete(item.id);
                          if (content.length === 1) {
                            onClose();
                          }
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-300 rounded-md hover:bg-red-50 transition-colors ml-auto"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {content.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => {
                onAddContent();
                onClose();
              }}
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
