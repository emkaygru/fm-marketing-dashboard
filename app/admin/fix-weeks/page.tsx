'use client';

import { useState } from 'react';

export default function FixWeeksPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runMigration = async () => {
    setLoading(true);
    setResult('Running migration...');

    try {
      const response = await fetch('/api/fix-week-of', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Success! Fixed ${data.updatedCount} posts.\n\nGo back to the Social Calendar to see your posts.`);
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Fix Week_Of Values
        </h1>
        <p className="text-gray-600 mb-6">
          This will recalculate the <code className="bg-gray-100 px-2 py-1 rounded">week_of</code> field
          for all existing social content posts. This fixes the issue where posts show in the calendar
          but not in the table view.
        </p>

        <button
          onClick={runMigration}
          disabled={loading}
          className="w-full px-6 py-3 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Running Migration...' : 'Run Migration'}
        </button>

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <pre className="text-sm text-gray-900 whitespace-pre-wrap">{result}</pre>
          </div>
        )}

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
