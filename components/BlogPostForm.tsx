'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BlogPostFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  mode: 'create' | 'edit';
}

export default function BlogPostForm({ isOpen, onClose, onSubmit, initialData, mode }: BlogPostFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    author: 'Beth Mazza',
    publish_date: '',
    link: '',
    status: 'draft',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        title: initialData.title || '',
        topic: initialData.topic || '',
        author: initialData.author || 'Beth Mazza',
        publish_date: initialData.publish_date || '',
        link: initialData.link || '',
        status: initialData.status || 'draft',
      });
    } else if (mode === 'create') {
      // Find next Wednesday
      const today = new Date();
      const nextWednesday = new Date(today);
      const daysUntilWednesday = (3 - today.getDay() + 7) % 7;
      nextWednesday.setDate(today.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday));

      setFormData({
        title: '',
        topic: '',
        author: 'Beth Mazza',
        publish_date: nextWednesday.toISOString().split('T')[0],
        link: '',
        status: 'draft',
      });
    }
  }, [mode, initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate it's a Wednesday
    const date = new Date(formData.publish_date);
    if (date.getDay() !== 3) {
      alert('Publish date must be a Wednesday!');
      return;
    }

    const submitData: any = { ...formData };

    if (mode === 'edit' && initialData) {
      submitData.id = initialData.id;
    }

    onSubmit(submitData);
    onClose();
  };

  const getNextWednesdays = () => {
    const wednesdays = [];
    const today = new Date();

    for (let i = 0; i < 12; i++) {
      const nextWed = new Date(today);
      const daysUntilWednesday = (3 - today.getDay() + 7) % 7;
      nextWed.setDate(today.getDate() + (daysUntilWednesday === 0 ? 7 : daysUntilWednesday) + (i * 7));
      wednesdays.push(nextWed.toISOString().split('T')[0]);
    }

    return wednesdays;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Add New Blog Post' : 'Edit Blog Post'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blog Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter blog post title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Topic / Theme
            </label>
            <input
              type="text"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="e.g., Leadership, Personal Growth, Business Strategy..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900 placeholder-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author
              </label>
              <select
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
              >
                <option value="Beth Mazza">Beth Mazza</option>
                <option value="Victoria Sivrais">Victoria Sivrais</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Publish Date (Wednesday) *
              </label>
              <select
                required
                value={formData.publish_date}
                onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-fm-blue text-gray-900"
              >
                <option value="">Select a Wednesday...</option>
                {getNextWednesdays().map((date) => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Blog Post Link
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              placeholder="https://..."
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
              <option value="in_progress">In Progress</option>
              <option value="published">Published</option>
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
              {mode === 'create' ? 'Create Blog Post' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
