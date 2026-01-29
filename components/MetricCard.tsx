'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: 'blue' | 'orange' | 'navy' | 'teal' | 'gray' | 'yellow';
  compact?: boolean;
  inverse?: boolean; // For metrics where decrease is good (e.g., bounce rate)
  isTime?: boolean;
  subtitle?: string; // Additional context like "+123 new"
}

const colorClasses = {
  blue: 'bg-blue-50 text-fm-blue',
  orange: 'bg-orange-50 text-fm-orange',
  navy: 'bg-indigo-50 text-fm-navy',
  teal: 'bg-teal-50 text-fm-teal',
  gray: 'bg-gray-50 text-fm-gray',
  yellow: 'bg-yellow-50 text-fm-yellow',
};

export default function MetricCard({
  title,
  value,
  change,
  icon,
  color,
  compact = false,
  inverse = false,
  isTime = false,
  subtitle,
}: MetricCardProps) {
  const isPositive = inverse ? change < 0 : change > 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';

  const formatValue = (val: string | number) => {
    if (isTime) return val;
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          {icon}
        </div>
        {!compact && (
          <div className={`flex items-center space-x-1 ${changeColor}`}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {Math.abs(change)}%
            </span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-sm text-fm-gray mb-1">{title}</p>
        <p className={`font-bold text-fm-navy ${compact ? 'text-2xl' : 'text-3xl'}`}>
          {formatValue(value)}
        </p>
        {subtitle && (
          <p className="text-xs text-fm-teal font-medium mt-1">{subtitle}</p>
        )}
        {compact && (
          <div className={`flex items-center space-x-1 mt-2 ${changeColor}`}>
            {isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-medium">
              {Math.abs(change)}% vs last period
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
