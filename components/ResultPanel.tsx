"use client";

import { ReactNode } from "react";

interface Props {
  title: string;
  status: "loading" | "found" | "not-found" | "error" | "unavailable";
  icon: ReactNode;
  children: ReactNode;
  error?: string;
  /** "positive": found = good (LEI, VAT). "inverse": found = a fuzzy match that needs review (sanctions). */
  polarity?: "positive" | "inverse";
  sourceLabel?: string;
  sourceUrl?: string;
  asOf?: string;
}

function statusConfig(polarity: "positive" | "inverse") {
  return {
    loading: { label: "Checking", color: "bg-faint" },
    found:
      polarity === "inverse"
        ? { label: "Possible match, review required", color: "bg-flag" }
        : { label: "On record", color: "bg-clear" },
    "not-found":
      polarity === "inverse"
        ? { label: "No match found", color: "bg-clear" }
        : { label: "No record", color: "bg-faint" },
    error: { label: "Error", color: "bg-flag" },
    unavailable: { label: "Unavailable", color: "bg-pending" },
  };
}

export default function ResultPanel({
  title,
  status,
  icon,
  children,
  error,
  polarity = "positive",
  sourceLabel,
  sourceUrl,
  asOf,
}: Props) {
  const { label, color } = statusConfig(polarity)[status];

  return (
    <div className="group flex flex-col h-full relative transition-colors duration-300 hover:bg-panel-2/40">
      {/* status accent bar */}
      <span
        className={`absolute top-0 left-0 right-0 h-[2px] ${color} opacity-70 group-hover:opacity-100 transition-opacity`}
        aria-hidden="true"
      />

      <div className="flex items-center justify-between gap-2 px-5 py-4 bg-panel-2 border-b border-hairline">
        <div className="flex items-center gap-2.5">
          <span className="text-brass transition-transform duration-300 group-hover:scale-110">
            {icon}
          </span>
          <h2 className="text-[13px] font-medium text-ivory">{title}</h2>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`w-1.5 h-1.5 rounded-full ${color} ${
              status === "loading" ? "animate-pulse" : ""
            }`}
            aria-hidden="true"
          />
          <span className="text-xs text-muted">{label}</span>
        </div>
      </div>

      <div className="px-5 py-4 flex-1">
        {status === "loading" ? (
          <div className="space-y-2.5">
            <div className="h-2.5 bg-panel-2 rounded-sm animate-pulse w-3/4" />
            <div className="h-2.5 bg-panel-2 rounded-sm animate-pulse w-1/2" />
            <div className="h-2.5 bg-panel-2 rounded-sm animate-pulse w-2/3" />
          </div>
        ) : error ? (
          <p className="text-sm text-flag">{error}</p>
        ) : (
          <div className="animate-rise">{children}</div>
        )}
      </div>

      {(sourceLabel || asOf) && status !== "loading" && (
        <div className="px-5 py-3 border-t border-hairline-soft flex items-center justify-between gap-3 text-[11px] text-faint">
          {sourceLabel && (
            <span className="flex items-center gap-1">
              Source:{" "}
              {sourceUrl ? (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted hover:text-brass underline decoration-hairline underline-offset-2 transition-colors"
                >
                  {sourceLabel}
                </a>
              ) : (
                <span className="text-muted">{sourceLabel}</span>
              )}
            </span>
          )}
          {asOf && <span className="font-mono shrink-0">as of {asOf}</span>}
        </div>
      )}
    </div>
  );
}
