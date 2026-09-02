interface Props {
  reason?: string;
}

export default function UnavailableState({ reason }: Props) {
  return (
    <div className="text-center py-4">
      <div className="inline-flex items-center gap-2 text-yellow-500 mb-1">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="text-sm font-medium">Data unavailable</span>
      </div>
      {reason && <p className="text-xs text-zinc-500 mt-1">{reason}</p>}
    </div>
  );
}
