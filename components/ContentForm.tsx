'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ContentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  mode: 'create' | 'edit' | 'duplicate';
}

export default function ContentForm({ isOpen, onClose, onSubmit, initialData, mode }: ContentFormProps) {
  const [formData, setFormData] = useState({
    post_date: '',
    content_type: 'Post',
    platform: 'Instagram',
    content_needs: '',
    asset_link: '',
    caption: '',
    status: 'draft',
    assigned_to: 'Ali',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        post_date: initialData.post_date || '',
        content_type: initialData.content_type || 'Post',
        platform: initialData.platform || 'Instagram',
        content_needs: initialData.content_needs || '',
        asset_link: initialData.asset_link || '',
        caption: initialData.caption || '',
        status: initialData.status || 'draft',
        assigned_to: initialData.assigned_to || 'Ali',
      });
    } else if (mode === 'duplicate' && initialData) {
      // For duplicate, copy content but reset date and asset
      setFormData({
        post_date: '',
        content_type: initialData.content_type || 'Post',
        platform: initialData.platform || 'Instagram',
        content_needs: initialData.content_needs || '',
        asset_link: '',
        caption: initialData.caption || '',
        status: 'draft',
        assigned_to: initialData.assigned_to || 'Ali',
      });
    } else if (mode === 'create') {
      // Reset form for new content
      setFormData({
        post_date: '',
        content_type: 'Post',
        platform: 'Instagram',
        content_needs: '',
        asset_link: '',
        caption: '',
        status: 'draft',
        assigned_to: 'Ali',
      });
    }
  }, [mode, initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate week_of (Monday of the week)
    const postDate = new Date(formData.post_date);
    const dayOfWeek = postDate.getDay();
    const diff = postDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekOf = new Date(postDate.setDate(diff)).toISOString().split('T')[0];

    const submitData: any = {
      ...formData,
      week_of: weekOf,
      created_by: 'Emily', // This should come from session/auth later
    };

    if (mode === 'edit' && initialData) {
      submitData.id = initialData.id;
    }

    onSubmit(submitData);
    onClose();
  };

  if (!isOpen) return null;

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Post Date *
              </label>
              <input
                type="date"
                required
                value={formData.post_date}
                onChange={(e) => setFormData({ ...formData, post_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content Type
              </label>
              <select
                value={formData.content_type}
                onChange={(e) => setFormData({ ...formData, content_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
              >
                <option value="Post">Post</option>
                <option value="Reel">Reel</option>
                <option value="Story">Story</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Platform
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
              >
                <option value="Instagram">Instagram</option>
                <option value="Facebook">Facebook</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
              >
                <option value="Ali">Ali</option>
                <option value="Beth">Beth</option>
                <option value="Emily">Emily</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asset Link (Canva, Google Drive, etc.)
            </label>
            <input
              type="url"
              value={formData.asset_link}
              onChange={(e) => setFormData({ ...formData, asset_link: e.target.value })}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
            />
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-fm-blue rounded-md hover:bg-fm-navy transition-colors"
            >
              {mode === 'create' && 'Create Content'}
              {mode === 'edit' && 'Save Changes'}
              {mode === 'duplicate' && 'Create Duplicate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
