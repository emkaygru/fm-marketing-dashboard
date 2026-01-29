'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Mail, Eye, MousePointerClick } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: number;
  name: string;
  sentDate: string;
  recipients: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
}

interface CampaignAccordionProps {
  campaigns?: Campaign[];
}

export default function CampaignAccordion({ campaigns = [] }: CampaignAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="flex items-center space-x-3">
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-fm-blue" />
          ) : (
            <ChevronDown className="w-5 h-5 text-fm-blue" />
          )}
          <span className="text-lg font-semibold text-fm-navy">Recent Campaigns (Last 3)</span>
        </div>
        <Link 
          href="/campaigns"
          className="text-sm text-fm-blue hover:text-fm-orange transition"
          onClick={(e) => e.stopPropagation()}
        >
          View All →
        </Link>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-3">
          {campaigns.length === 0 ? (
            <div className="text-center py-8 text-fm-gray">No recent campaigns</div>
          ) : (
            campaigns.map((campaign) => (
              <div
                key={campaign.id}
                className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-fm-navy">{campaign.name}</h4>
                    <p className="text-sm text-fm-gray">{formatDate(campaign.sentDate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-fm-blue" />
                    <div>
                      <div className="text-fm-gray">Sent</div>
                      <div className="font-semibold text-fm-navy">{campaign.recipients.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-fm-orange" />
                    <div>
                      <div className="text-fm-gray">Opens</div>
                      <div className="font-semibold text-fm-navy">{campaign.opens} ({campaign.openRate}%)</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MousePointerClick className="w-4 h-4 text-fm-teal" />
                    <div>
                      <div className="text-fm-gray">Clicks</div>
                      <div className="font-semibold text-fm-navy">{campaign.clicks} ({campaign.clickRate}%)</div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
