// ===== Status Dot — Reusable online/away/offline indicator =====

interface StatusDotProps {
  status: 'online' | 'away' | 'offline';
  size?: 'sm' | 'md';
}

export function StatusDot({ status, size = 'sm' }: StatusDotProps) {
  const sizeClass = size === 'sm' ? 'size-3' : 'size-4';
  const colorClass =
    status === 'online'
      ? 'bg-green-500'
      : status === 'away'
        ? 'bg-yellow-500'
        : 'bg-gray-400';

  return (
    <div
      className={`absolute bottom-0 right-0 ${sizeClass} rounded-full border-2 border-white ${colorClass}`}
    />
  );
}
