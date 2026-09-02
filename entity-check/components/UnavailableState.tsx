interface UnavailableStateProps {
  source: string;
  reason?: string;
}

export default function UnavailableState({ source, reason }: UnavailableStateProps) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-warning-soft flex items-center justify-center mb-3">
        <svg className="w-5 h-5 text-warning" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <p className="text-sm font-medium text-text">{source} unavailable</p>
      <p className="text-xs text-text-tertiary mt-1">{reason || "Timed out. Try again."}</p>
    </div>
  );
}
