'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CampaignFormProps {
  campaign?: any; // Existing campaign for editing
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
}

export default function CampaignForm({ campaign, onClose, onSave }: CampaignFormProps) {
  const [formData, setFormData] = useState({
    name: campaign?.name || '',
    sendDate: campaign?.sendDate || new Date().toISOString().split('T')[0],
    recipients: campaign?.delivered || '',
    opens: campaign?.rawOpens || '',
    clicks: campaign?.rawClicks || '',
    bounce: campaign?.bounce || 0,
    unsubscribed: campaign?.unsubscribed || 0,
    spam: campaign?.spam || 0,
    notes: campaign?.notes || '',
    hasAbTest: !!campaign?.abResults,
    subjectA: campaign?.abResults?.subjectA || '',
    subjectB: campaign?.abResults?.subjectB || '',
    winner: campaign?.abResults?.winner || 'A',
    opensA: campaign?.abResults?.opensA || '',
    opensB: campaign?.abResults?.opensB || '',
  });

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const submitData: any = {
        name: formData.name,
        sendDate: formData.sendDate,
        recipients: parseInt(formData.recipients as string) || 0,
        opens: parseInt(formData.opens as string) || 0,
        clicks: parseInt(formData.clicks as string) || 0,
        bounce: parseInt(formData.bounce as string) || 0,
        unsubscribed: parseInt(formData.unsubscribed as string) || 0,
        spam: parseInt(formData.spam as string) || 0,
        notes: formData.notes,
      };

      if (formData.hasAbTest && formData.subjectA && formData.subjectB) {
        submitData.abResults = {
          hasTest: true,
          subjectA: formData.subjectA,
          subjectB: formData.subjectB,
          winner: formData.winner,
          opensA: parseInt(formData.opensA as string) || 0,
          opensB: parseInt(formData.opensB as string) || 0,
        };
      }

      if (campaign?.id) {
        submitData.id = campaign.id;
      }

      await onSave(submitData);
      onClose();
    } catch (error) {
      console.error('Error saving campaign:', error);
      alert('Failed to save campaign. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full my-8">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-fm-navy">
              {campaign ? 'Edit Campaign' : 'New Campaign'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <X className="w-5 h-5 text-fm-gray" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Basic Info */}
            <div>
              <label className="block text-sm font-medium text-fm-gray mb-2">
                Campaign Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                placeholder="e.g., Weekly Newsletter - January 2026"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Send Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.sendDate}
                  onChange={(e) => setFormData({ ...formData, sendDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Recipients (Total Sent) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.recipients}
                  onChange={(e) => setFormData({ ...formData, recipients: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                  placeholder="e.g., 3420"
                />
              </div>
            </div>

            {/* Email Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Opens (raw number) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.opens}
                  onChange={(e) => setFormData({ ...formData, opens: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                  placeholder="e.g., 856"
                />
                <p className="text-xs text-fm-gray mt-1">
                  Open rate will be calculated automatically
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Clicks (raw number) *
                </label>
                <input
                  type="number"
                  required
                  value={formData.clicks}
                  onChange={(e) => setFormData({ ...formData, clicks: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                  placeholder="e.g., 142"
                />
                <p className="text-xs text-fm-gray mt-1">
                  Click rate will be calculated automatically
                </p>
              </div>
            </div>

            {/* Optional Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Bounce
                </label>
                <input
                  type="number"
                  value={formData.bounce}
                  onChange={(e) => setFormData({ ...formData, bounce: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Unsubscribes
                </label>
                <input
                  type="number"
                  value={formData.unsubscribed}
                  onChange={(e) => setFormData({ ...formData, unsubscribed: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-fm-gray mb-2">
                  Spam
                </label>
                <input
                  type="number"
                  value={formData.spam}
                  onChange={(e) => setFormData({ ...formData, spam: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* A/B Test Section */}
            <div className="border-t border-gray-200 pt-6">
              <label className="flex items-center space-x-3 mb-4">
                <input
                  type="checkbox"
                  checked={formData.hasAbTest}
                  onChange={(e) => setFormData({ ...formData, hasAbTest: e.target.checked })}
                  className="w-5 h-5 text-fm-blue border-gray-300 rounded focus:ring-fm-blue"
                />
                <span className="text-sm font-medium text-fm-navy">
                  This campaign had an A/B test
                </span>
              </label>

              {formData.hasAbTest && (
                <div className="space-y-4 pl-8">
                  <div>
                    <label className="block text-sm font-medium text-fm-gray mb-2">
                      Subject Line A
                    </label>
                    <input
                      type="text"
                      value={formData.subjectA}
                      onChange={(e) => setFormData({ ...formData, subjectA: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                      placeholder="First subject line variant"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-fm-gray mb-2">
                      Subject Line B
                    </label>
                    <input
                      type="text"
                      value={formData.subjectB}
                      onChange={(e) => setFormData({ ...formData, subjectB: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                      placeholder="Second subject line variant"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-fm-gray mb-2">
                        Winner
                      </label>
                      <select
                        value={formData.winner}
                        onChange={(e) => setFormData({ ...formData, winner: e.target.value as 'A' | 'B' })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                      >
                        <option value="A">A</option>
                        <option value="B">B</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fm-gray mb-2">
                        Opens A
                      </label>
                      <input
                        type="number"
                        value={formData.opensA}
                        onChange={(e) => setFormData({ ...formData, opensA: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-fm-gray mb-2">
                        Opens B
                      </label>
                      <input
                        type="number"
                        value={formData.opensB}
                        onChange={(e) => setFormData({ ...formData, opensB: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-fm-gray mb-2">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-fm-blue focus:border-transparent"
                placeholder="Any additional notes about this campaign..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-fm-gray hover:bg-gray-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-fm-blue text-white rounded-lg hover:bg-opacity-90 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : campaign ? 'Update Campaign' : 'Add Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
