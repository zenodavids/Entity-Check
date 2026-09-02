"use client";

import { ReactNode } from "react";

type Status = "loading" | "found" | "not-found" | "error" | "unavailable";

interface ResultPanelProps {
  title: string;
  icon: ReactNode;
  status: Status;
  source?: string;
  sourceUrl?: string;
  timestamp?: string;
  badge?: { label: string; variant: "solid" | "dashed" };
  children?: ReactNode;
  index?: number;
}

export default function ResultPanel({
  title,
  icon,
  status,
  source,
  sourceUrl,
  timestamp,
  badge,
  children,
  index = 0,
}: ResultPanelProps) {
  return (
    <div
      className="bg-bg-card rounded-3xl border border-border shadow-sm overflow-hidden animate-slide-up"
      style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
    >
      <div className="px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-accent-soft flex items-center justify-center text-accent">
            {icon}
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-text tracking-tight">{title}</h3>
            {source && (
              <p className="text-[12px] text-text-tertiary mt-0.5">
                {sourceUrl ? (
                  <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors underline underline-offset-2 decoration-border hover:decoration-accent">
                    {source}
                  </a>
                ) : source}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {badge && (
            <span
              className={`px-3 py-1 text-[11px] font-semibold tracking-wide rounded-full ${
                badge.variant === "dashed"
                  ? "bg-warning-soft text-warning"
                  : "bg-success-soft text-success"
              }`}
            >
              {badge.label}
            </span>
          )}
          <StatusBadge status={status} />
        </div>
      </div>

      <div className="px-6 pb-6 min-h-[60px]">
        {status === "loading" && (
          <div className="flex items-center gap-3 py-2">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-sm text-text-secondary">Checking...</span>
          </div>
        )}
        {children}
      </div>

      {timestamp && (
        <div className="px-6 py-3 border-t border-border-subtle text-[11px] text-text-tertiary">
          Updated {new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const config = {
    loading: { text: "Checking", bg: "bg-accent-soft", color: "text-accent", dot: "bg-accent animate-pulse-dot" },
    found: { text: "Found", bg: "bg-success-soft", color: "text-success", dot: "bg-success" },
    "not-found": { text: "None", bg: "bg-bg-subtle dark:bg-white/5", color: "text-text-tertiary", dot: "bg-text-tertiary" },
    error: { text: "Error", bg: "bg-danger-soft", color: "text-danger", dot: "bg-danger" },
    unavailable: { text: "Unavailable", bg: "bg-warning-soft", color: "text-warning", dot: "bg-warning" },
  };

  const c = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-full ${c.bg} ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.text}
    </span>
  );
}
