interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyles = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'ready_for_approval':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'needs_edits':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'approved':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'scheduled':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'posted':
        return 'bg-emerald-100 text-emerald-700 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}
