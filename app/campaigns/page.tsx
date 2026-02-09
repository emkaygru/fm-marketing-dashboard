'use client';

import { useState, useEffect } from 'react';
import { Mail, Eye, MousePointerClick, Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import CampaignForm from '@/components/CampaignForm';

interface Campaign {
  id: number;
  name: string;
  sendDate: string;
  delivered: number;
  opened: number;
  clicked: number;
  bounce: number;
  unsubscribed: number;
  spam: number;
  raw_opens?: number;
  raw_clicks?: number;
  notes?: string;
  ab_subject_a?: string;
  ab_subject_b?: string;
  ab_winner?: string;
  ab_opened_a?: number;
  ab_opened_b?: number;
  ab_opens_a?: number;
  ab_opens_b?: number;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<number | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCampaign = async (campaignData: any) => {
    try {
      // Calculate rates from raw numbers
      const delivered = campaignData.recipients || 0;
      const rawOpens = campaignData.opens || 0;
      const rawClicks = campaignData.clicks || 0;
      const opened = delivered > 0 ? ((rawOpens / delivered) * 100).toFixed(2) : '0.00';
      const clicked = delivered > 0 ? ((rawClicks / delivered) * 100).toFixed(2) : '0.00';

      const payload: any = {
        name: campaignData.name,
        sendDate: campaignData.sendDate,
        delivered: delivered,
        opened: parseFloat(opened),
        clicked: parseFloat(clicked),
        bounce: campaignData.bounce || 0,
        unsubscribed: campaignData.unsubscribed || 0,
        spam: campaignData.spam || 0,
        raw_opens: rawOpens,
        raw_clicks: rawClicks,
        notes: campaignData.notes || null,
      };

      // Handle A/B test data
      if (campaignData.abResults) {
        payload.ab_subject_a = campaignData.abResults.subjectA || null;
        payload.ab_subject_b = campaignData.abResults.subjectB || null;
        payload.ab_winner = campaignData.abResults.winner || null;
        payload.ab_opens_a = campaignData.abResults.opensA || null;
        payload.ab_opens_b = campaignData.abResults.opensB || null;

        // Calculate A/B click rates from opens if available
        if (campaignData.abResults.opensA && delivered > 0) {
          payload.ab_opened_a = ((campaignData.abResults.opensA / delivered) * 100).toFixed(2);
        }
        if (campaignData.abResults.opensB && delivered > 0) {
          payload.ab_opened_b = ((campaignData.abResults.opensB / delivered) * 100).toFixed(2);
        }
      }

      if (editingCampaign) {
        payload.id = editingCampaign.id;
      }

      const response = await fetch('/api/campaigns', {
        method: editingCampaign ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchCampaigns();
        setIsFormOpen(false);
        setEditingCampaign(null);
      }
    } catch (error) {
      console.error('Error saving campaign:', error);
      throw error;
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;

    try {
      const response = await fetch(`/api/campaigns?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCampaigns();
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/analytics"
                className="inline-flex items-center text-sm text-fm-blue hover:text-fm-navy mb-2"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Analytics
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Email Campaigns</h1>
              <p className="mt-1 text-sm text-gray-500">
                Manage and track your newsletter campaigns
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCampaign(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {campaigns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Mail className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first email campaign.</p>
            <button
              onClick={() => setIsFormOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-fm-blue text-white rounded-md hover:bg-fm-navy transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Campaign
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{campaign.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Sent: {formatDate(campaign.sendDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCampaign(campaign);
                        setIsFormOpen(true);
                      }}
                      className="p-2 text-gray-600 hover:text-fm-blue hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Main Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="w-8 h-8 text-fm-blue" />
                    <div>
                      <div className="text-xs text-gray-500">Delivered</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {campaign.delivered.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                    <Eye className="w-8 h-8 text-fm-orange" />
                    <div>
                      <div className="text-xs text-gray-500">Open Rate</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {campaign.opened}%
                      </div>
                      {campaign.raw_opens && (
                        <div className="text-xs text-gray-400">
                          {campaign.raw_opens} opens
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-teal-50 rounded-lg">
                    <MousePointerClick className="w-8 h-8 text-fm-teal" />
                    <div>
                      <div className="text-xs text-gray-500">Click Rate</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {campaign.clicked}%
                      </div>
                      {campaign.raw_clicks && (
                        <div className="text-xs text-gray-400">
                          {campaign.raw_clicks} clicks
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 font-semibold">
                      !
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Issues</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {campaign.bounce + campaign.spam}
                      </div>
                      <div className="text-xs text-gray-400">
                        {campaign.bounce} bounce, {campaign.spam} spam
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="flex items-center justify-between gap-6 text-sm text-gray-600 pt-3 border-t border-gray-200">
                  <span>Unsubscribed: {campaign.unsubscribed}</span>
                  {(campaign.ab_subject_a || campaign.notes) && (
                    <button
                      onClick={() => setExpandedCampaign(expandedCampaign === campaign.id ? null : campaign.id)}
                      className="text-fm-blue hover:text-fm-navy text-sm font-medium"
                    >
                      {expandedCampaign === campaign.id ? 'Hide Details ▲' : 'Show Details ▼'}
                    </button>
                  )}
                </div>

                {/* Expanded Details */}
                {expandedCampaign === campaign.id && (
                  <div className="mt-4 space-y-4">
                    {/* A/B Test Results */}
                    {campaign.ab_subject_a && campaign.ab_subject_b && (
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h4 className="text-sm font-semibold text-purple-900 mb-3">A/B Test Results</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className={`p-3 rounded-lg ${campaign.ab_winner === 'A' ? 'bg-green-100 border-2 border-green-500' : 'bg-white'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">Subject A</span>
                              {campaign.ab_winner === 'A' && (
                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">WINNER</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{campaign.ab_subject_a}</p>
                            <div className="space-y-1">
                              {campaign.ab_opens_a && (
                                <p className="text-xs text-gray-600">Opens: {campaign.ab_opens_a} ({campaign.ab_opened_a}%)</p>
                              )}
                            </div>
                          </div>
                          <div className={`p-3 rounded-lg ${campaign.ab_winner === 'B' ? 'bg-green-100 border-2 border-green-500' : 'bg-white'}`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-600">Subject B</span>
                              {campaign.ab_winner === 'B' && (
                                <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded font-medium">WINNER</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-900 mb-2">{campaign.ab_subject_b}</p>
                            <div className="space-y-1">
                              {campaign.ab_opens_b && (
                                <p className="text-xs text-gray-600">Opens: {campaign.ab_opens_b} ({campaign.ab_opened_b}%)</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {campaign.notes && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Notes:</span> {campaign.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Campaign Form Modal */}
      {isFormOpen && (
        <CampaignForm
          campaign={editingCampaign}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCampaign(null);
          }}
          onSave={handleSaveCampaign}
        />
      )}
    </div>
  );
}
