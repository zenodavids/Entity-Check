interface MatchDetailProps {
  matchedAlias: string;
  confidence: number;
  source: string;
}

export default function MatchDetail({
  matchedAlias,
  confidence,
  source,
}: MatchDetailProps) {
  return (
    <div className="rounded-2xl border border-warning/20 bg-warning-soft p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-warning uppercase tracking-wider">
          Possible match
        </span>
        <span className="text-xs font-mono font-bold text-warning bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-lg">
          {confidence}%
        </span>
      </div>
      <p className="text-sm text-text">
        <span className="text-text-secondary">Matched: </span>
        <span className="font-medium">{matchedAlias}</span>
      </p>
      <p className="text-[11px] text-text-tertiary">{source}</p>
    </div>
  );
}
