'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  initialData?: any;
  mode: 'create' | 'edit' | 'duplicate';
}

export default function ContentForm({ isOpen, onClose, onSubmit, initialData, mode }: ContentFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    post_date: '',
    content_type: 'Post',
    platforms: ['Instagram'] as string[], // array — checkboxes in create/duplicate, single-select in edit
    content_needs: '',
    asset_link: '',
    caption: '',
    status: 'draft',
    assigned_to: 'Emily',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        post_date: initialData.post_date ? String(initialData.post_date).slice(0, 10) : '',
        content_type: initialData.content_type || 'Post',
        platforms: [initialData.platform || 'Instagram'],
        content_needs: initialData.content_needs || '',
        asset_link: initialData.asset_link || '',
        caption: initialData.caption || '',
        status: initialData.status || 'draft',
        assigned_to: initialData.assigned_to || 'Emily',
      });
    } else if (mode === 'duplicate' && initialData) {
      // Keep all content including date and asset — only reset status to draft
      setFormData({
        post_date: initialData.post_date || '',
        content_type: initialData.content_type || 'Post',
        platforms: [initialData.platform || 'Instagram'],
        content_needs: initialData.content_needs || '',
        asset_link: initialData.asset_link || '',
        caption: initialData.caption || '',
        status: 'draft',
        assigned_to: initialData.assigned_to || 'Emily',
      });
    } else if (mode === 'create') {
      // Pre-fill date from calendar click if provided (initialData?.post_date)
      setFormData({
        post_date: initialData?.post_date || '',
        content_type: 'Post',
        platforms: ['Instagram'],
        content_needs: '',
        asset_link: '',
        caption: '',
        status: 'draft',
        assigned_to: 'Emily',
      });
    }
  }, [mode, initialData, isOpen]);

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.platforms.length === 0) {
      setSubmitError('Please select at least one platform.');
      return;
    }
    setSubmitError(null);
    setSubmitting(true);

    // Calculate week_of (Monday of the week) using local time to avoid UTC shift
    const [year, month, day] = formData.post_date.split('-').map(Number);
    const postDate = new Date(year, month - 1, day);
    const dayOfWeek = postDate.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(year, month - 1, day + diff);
    const weekOf = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;

    const baseData = {
      post_date: formData.post_date,
      content_type: formData.content_type,
      content_needs: formData.content_needs,
      asset_link: formData.asset_link,
      caption: formData.caption,
      status: formData.status,
      assigned_to: formData.assigned_to,
      week_of: weekOf,
      created_by: 'Emily',
    };

    try {
      if (mode === 'edit' && initialData) {
        // Edit: single record, single platform
        await onSubmit({ ...baseData, platform: formData.platforms[0], id: initialData.id });
      } else {
        // Create / Duplicate: one record per selected platform
        const payloads = formData.platforms.map((platform) => ({ ...baseData, platform }));
        await onSubmit(payloads);
      }
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const PLATFORMS = ['Instagram', 'Facebook', 'LinkedIn'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' && 'Add New Content'}
            {mode === 'edit' && 'Edit Content'}
            {mode === 'duplicate' && 'Duplicate Content'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post Date *
              </label>
              <input
                type="date"
                required
                value={formData.post_date}
                onChange={(e) => setFormData({ ...formData, post_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
              >
                <option value="Post">Post</option>
                <option value="Reel">Reel</option>
                <option value="Story">Story</option>
                <option value="Carousel">Carousel</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Platform — checkboxes for create/duplicate, single select for edit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform{mode !== 'edit' ? '(s)' : ''}
              </label>
              {mode === 'edit' ? (
                <select
                  value={formData.platforms[0] || 'Instagram'}
                  onChange={(e) => setFormData({ ...formData, platforms: [e.target.value] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  {PLATFORMS.map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.platforms.includes(p)}
                        onChange={() => togglePlatform(p)}
                        className="w-4 h-4 rounded border-gray-300 text-fm-blue focus:ring-fm-blue"
                      />
                      <span className="text-sm text-gray-700">{p}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
              >
                <option value="Emily">Emily</option>
                <option value="Ali">Ali</option>
                <option value="Beth">Beth</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content Needs / Topic
            </label>
            <textarea
              value={formData.content_needs}
              onChange={(e) => setFormData({ ...formData, content_needs: e.target.value })}
              rows={3}
              placeholder="Describe the content topic or requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            {formData.content_type === 'Carousel' ? (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Carousel Images
                  <span className="ml-1 text-xs font-normal text-gray-400">(one Google Drive file URL per line)</span>
                </label>
                <textarea
                  value={formData.asset_link}
                  onChange={(e) => setFormData({ ...formData, asset_link: e.target.value })}
                  rows={5}
                  placeholder={"https://drive.google.com/file/d/abc123/view\nhttps://drive.google.com/file/d/def456/view\n..."}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400 font-mono text-xs"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Share each image in Drive → Copy link → paste here. Images appear as a swipeable preview.
                </p>
              </>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Link (Canva, Google Drive, etc.)
                </label>
                <input
                  type="url"
                  value={formData.asset_link}
                  onChange={(e) => setFormData({ ...formData, asset_link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
                />
              </>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Caption
            </label>
            <textarea
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              rows={4}
              placeholder="Write the caption for this post..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
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

          {mode !== 'edit' && formData.platforms.length > 1 && (
            <div className="px-4 py-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
              This will create <strong>{formData.platforms.length} separate posts</strong> — one for each selected platform ({formData.platforms.join(', ')}).
            </div>
          )}

          {submitError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-fm-blue rounded-md hover:bg-fm-navy transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving...' : (
                <>
                  {mode === 'create' && (formData.platforms.length > 1 ? `Create ${formData.platforms.length} Posts` : 'Create Content')}
                  {mode === 'edit' && 'Save Changes'}
                  {mode === 'duplicate' && (formData.platforms.length > 1 ? `Create ${formData.platforms.length} Duplicates` : 'Create Duplicate')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
