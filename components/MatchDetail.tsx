"use client";

import { useState } from "react";
import { SanctionMatch } from "@/lib/sanctions-parser";

interface Props {
  match: SanctionMatch;
}

function scoreColor(score: number): string {
  if (score >= 0.95) return "text-flag";
  if (score >= 0.9) return "text-pending";
  return "text-muted";
}

export default function MatchDetail({ match }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(match.matchedName);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="mb-3 last:mb-0 rounded-sm border border-dashed border-hairline hover:border-flag/50 transition-colors cursor-pointer px-3.5 py-3"
      onClick={() => setExpanded((v) => !v)}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => e.key === "Enter" && setExpanded((v) => !v)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ivory truncate">
            {match.matchedName}
          </p>
          <p className="text-xs text-muted mt-0.5">
            {match.source}
            {match.entryType && ` · ${match.entryType}`}
            {match.country && ` · ${match.country}`}
          </p>
        </div>
        <span
          className={`text-sm font-mono ${scoreColor(match.score)} shrink-0`}
        >
          {(match.score * 100).toFixed(1)}%
        </span>
      </div>

      {match.programs && match.programs.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {match.programs.map((prog, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded-sm border border-hairline text-muted"
            >
              {prog}
            </span>
          ))}
        </div>
      )}

      {match.remarks && (
        <p
          className={`mt-2 text-xs text-faint italic leading-relaxed ${
            expanded ? "" : "line-clamp-2"
          }`}
        >
          {match.remarks}
        </p>
      )}

      <div className="mt-2 flex items-center gap-4">
        {match.remarks && match.remarks.length > 90 && (
          <button
            className="text-[11px] text-brass hover:text-brass-dim transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
        <button
          onClick={handleCopy}
          className="text-[11px] text-faint hover:text-brass transition-colors"
        >
          {copied ? "Copied" : "Copy matched name"}
        </button>
      </div>
    </div>
  );
}
