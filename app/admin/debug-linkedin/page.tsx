'use client';

import { useState, useEffect } from 'react';

export default function DebugLinkedInPage() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social-content?platform=LinkedIn');
      const data = await response.json();
      setContent(data.content || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Debug: All LinkedIn Content
        </h1>
        <p className="text-gray-600 mb-6">
          Total LinkedIn posts: {content.length}
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Post Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Week Of</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Assigned To</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Content Needs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {content.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No LinkedIn posts found
                  </td>
                </tr>
              ) : (
                content.map((post) => (
                  <tr key={post.id} className={`hover:bg-gray-50 ${post.assigned_to === 'Beth' ? 'bg-green-50' : ''}`}>
                    <td className="px-4 py-2 text-sm text-gray-900">{post.id}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {post.post_date}
                      <div className="text-xs text-gray-500">
                        {new Date(post.post_date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm font-mono text-gray-900">
                      {post.week_of}
                      <div className="text-xs text-gray-500">
                        {new Date(post.week_of).toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        post.assigned_to === 'Beth'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}>
                        {post.assigned_to}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {post.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 max-w-xs truncate">
                      {post.content_needs || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">Filter Test</h3>
          <div className="text-sm text-blue-800">
            <p>Beth's posts (green background): {content.filter(p => p.assigned_to === 'Beth').length}</p>
            <p>Other posts: {content.filter(p => p.assigned_to !== 'Beth').length}</p>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/beth-linkedin"
            className="text-fm-blue hover:text-fm-navy underline text-sm mr-4"
          >
            ← Back to Beth's LinkedIn
          </a>
          <a
            href="/social-calendar"
            className="text-fm-blue hover:text-fm-navy underline text-sm"
          >
            View Social Calendar
          </a>
        </div>
      </div>
    </div>
  );
}
