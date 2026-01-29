'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Calendar as CalendarIcon, List } from 'lucide-react';
import ContentTable from '@/components/ContentTable';
import CalendarGrid from '@/components/CalendarGrid';
import ContentForm from '@/components/ContentForm';
import CommentThread from '@/components/CommentThread';

export default function SocialCalendarPage() {
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCommentThreadOpen, setIsCommentThreadOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('socialCalendarView');
    if (savedView === 'calendar' || savedView === 'table') {
      setViewMode(savedView);
    }
  }, []);

  // Save view preference to localStorage
  const handleViewModeChange = (mode: 'table' | 'calendar') => {
    setViewMode(mode);
    localStorage.setItem('socialCalendarView', mode);
  };

  const handleAddContent = () => {
    setFormMode('create');
    setSelectedContent(null);
    setIsFormOpen(true);
  };

  const handleEditContent = (content: any) => {
    setFormMode('edit');
    setSelectedContent(content);
    setIsFormOpen(true);
  };

  const handleDuplicateContent = (content: any) => {
    setFormMode('duplicate');
    setSelectedContent(content);
    setIsFormOpen(true);
  };

  const handleCommentContent = (content: any) => {
    setSelectedContent(content);
    setIsCommentThreadOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      const method = formMode === 'edit' ? 'PUT' : 'POST';
      const response = await fetch('/api/social-content', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Content saved successfully:', result);
        setRefreshTrigger((prev) => prev + 1);
        setIsFormOpen(false);
      } else {
        const error = await response.json();
        console.error('Error response:', error);
        alert(`Error: ${error.error || 'Failed to save content'}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to save content. Check console for details.');
    }
  };

  const handleDeleteContent = async (id: number) => {
    try {
      const response = await fetch(`/api/social-content?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Social Calendar</h1>
              <p className="mt-1 text-sm text-gray-500">
                Plan and manage your Instagram, Facebook, and LinkedIn content
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-gray-100 rounded-md p-1">
                <button
                  onClick={() => handleViewModeChange('table')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white text-fm-blue shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                  Table
                </button>
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-fm-blue shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CalendarIcon className="w-4 h-4" />
                  Calendar
                </button>
              </div>

              <button
                onClick={handleAddContent}
                className="flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Content
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'table' ? (
          <ContentTable
            onEdit={handleEditContent}
            onDelete={handleDeleteContent}
            onDuplicate={handleDuplicateContent}
            onComment={handleCommentContent}
            refreshTrigger={refreshTrigger}
          />
        ) : (
          <CalendarGrid
            onDayClick={(date, dayContent) => {
              // When clicking a day, you could show content details or open form
              if (dayContent.length > 0) {
                // Show first content item
                handleCommentContent(dayContent[0]);
              } else {
                // Open form to create content for that day
                setFormMode('create');
                setSelectedContent({ post_date: format(date, 'yyyy-MM-dd') });
                setIsFormOpen(true);
              }
            }}
            refreshTrigger={refreshTrigger}
          />
        )}
      </div>

      {/* Modals */}
      <ContentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedContent}
        mode={formMode}
      />

      <CommentThread
        isOpen={isCommentThreadOpen}
        onClose={() => setIsCommentThreadOpen(false)}
        contentId={selectedContent?.id}
        contentTitle={selectedContent?.content_needs}
      />
    </div>
  );
}
