'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';

interface Campaign {
  id: number;
  name: string;
  sendDate: string;
  delivered: number;
  opened: number;
  clicked: number;
}

export default function CleanupCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [duplicates, setDuplicates] = useState<{ [key: string]: Campaign[] }>({});
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      const allCampaigns = data.campaigns || [];
      setCampaigns(allCampaigns);

      // Find duplicates by name and send_date
      const grouped: { [key: string]: Campaign[] } = {};
      allCampaigns.forEach((campaign: Campaign) => {
        const key = `${campaign.name}|${campaign.sendDate}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(campaign);
      });

      // Keep only groups with more than one campaign
      const dupsOnly: { [key: string]: Campaign[] } = {};
      Object.entries(grouped).forEach(([key, camps]) => {
        if (camps.length > 1) {
          dupsOnly[key] = camps;
        }
      });

      setDuplicates(dupsOnly);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    setDeleting(id);
    try {
      const response = await fetch(`/api/campaigns?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    } finally {
      setDeleting(null);
    }
  };

  const handleKeepNewestDeleteRest = async (group: Campaign[]) => {
    if (!confirm(`Delete ${group.length - 1} duplicate(s) and keep the newest one?`)) return;

    // Sort by ID (assuming higher ID = newer)
    const sorted = [...group].sort((a, b) => b.id - a.id);
    const toDelete = sorted.slice(1); // All except the first (newest)

    for (const campaign of toDelete) {
      try {
        await fetch(`/api/campaigns?id=${campaign.id}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.error(`Error deleting campaign ${campaign.id}:`, error);
      }
    }

    await fetchCampaigns();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading campaigns...</div>
      </div>
    );
  }

  const duplicateCount = Object.values(duplicates).reduce((acc, group) => acc + group.length - 1, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cleanup Duplicate Campaigns</h1>
            <p className="mt-1 text-sm text-gray-500">
              Remove duplicate campaign entries from the database
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Found {Object.keys(duplicates).length} duplicate group(s)
              </h2>
              <p className="text-sm text-gray-600">
                Total campaigns: {campaigns.length} • Duplicates to remove: {duplicateCount}
              </p>
            </div>
          </div>
        </div>

        {Object.keys(duplicates).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No duplicates found!</h3>
            <p className="text-gray-500">Your campaigns database is clean.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(duplicates).map(([key, group]) => {
              const [name, sendDate] = key.split('|');
              return (
                <div key={key} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                      <p className="text-sm text-gray-500">
                        Send Date: {new Date(sendDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-sm text-orange-600 font-medium mt-1">
                        {group.length} duplicate entries found
                      </p>
                    </div>
                    <button
                      onClick={() => handleKeepNewestDeleteRest(group)}
                      className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors text-sm font-medium"
                    >
                      Keep Newest, Delete Rest
                    </button>
                  </div>

                  <div className="space-y-3">
                    {group.map((campaign, index) => (
                      <div
                        key={campaign.id}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          index === 0 ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {index === 0 && (
                              <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                                NEWEST
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-700">ID: {campaign.id}</span>
                          </div>
                          <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Delivered:</span>
                              <span className="ml-2 font-medium text-gray-900">{campaign.delivered}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Open Rate:</span>
                              <span className="ml-2 font-medium text-gray-900">{campaign.opened}%</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Click Rate:</span>
                              <span className="ml-2 font-medium text-gray-900">{campaign.clicked}%</span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          disabled={deleting === campaign.id}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
                        >
                          {deleting === campaign.id ? (
                            <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All Campaigns List */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Campaigns ({campaigns.length})</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Send Date</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Delivered</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{campaign.id}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{campaign.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {new Date(campaign.sendDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{campaign.delivered}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDelete(campaign.id)}
                        disabled={deleting === campaign.id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/campaigns"
            className="text-fm-blue hover:text-fm-navy underline text-sm"
          >
            ← Back to Campaigns
          </a>
        </div>
      </div>
    </div>
  );
}
