'use client';

import { useState, useEffect } from 'react';

export default function DebugPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/social-content');
      const data = await response.json();
      setPosts(data.content || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
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
          Debug: All Social Content Posts
        </h1>
        <p className="text-gray-600 mb-6">
          Total posts: {posts.length}
        </p>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Post Date</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Week Of</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Platform</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Content Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Content Needs</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No posts found
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
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
                    <td className="px-4 py-2 text-sm text-gray-900">{post.platform}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{post.content_type}</td>
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

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Week Calculation Test</h2>
          <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
            <div>Today: {new Date().toISOString().split('T')[0]}</div>
            <div>Current week Monday: {
              (() => {
                const today = new Date();
                const dayOfWeek = today.getDay();
                const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                const monday = new Date(today);
                monday.setDate(today.getDate() + diff);
                return monday.toISOString().split('T')[0];
              })()
            }</div>
          </div>
        </div>

        <div className="mt-6">
          <a
            href="/social-calendar"
            className="text-fm-blue hover:text-fm-navy underline text-sm"
          >
            ← Back to Social Calendar
          </a>
        </div>
      </div>
    </div>
  );
}
