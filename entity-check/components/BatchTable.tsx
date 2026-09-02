"use client";

import { useState, useMemo } from "react";
import { BatchItem } from "@/lib/types";

interface BatchTableProps {
  items: BatchItem[];
}

type SortKey = "query" | "status" | "lei" | "vat" | "sanctions";
type SortDir = "asc" | "desc";

export default function BatchTable({ items }: BatchTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("query");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [filter, setFilter] = useState<"all" | "complete" | "error">("all");

  const sorted = useMemo(() => {
    let filtered = items;
    if (filter !== "all") {
      filtered = items.filter((item) => item.status === filter);
    }

    return [...filtered].sort((a, b) => {
      let aVal: string;
      let bVal: string;

      switch (sortKey) {
        case "query":
          aVal = a.query;
          bVal = b.query;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "lei":
          aVal = a.result?.lei?.entityStatus || "";
          bVal = b.result?.lei?.entityStatus || "";
          break;
        case "vat":
          aVal = String(a.result?.vat?.isValid ?? "");
          bVal = String(b.result?.vat?.isValid ?? "");
          break;
        case "sanctions":
          aVal = String(a.result?.sanctions?.length || 0);
          bVal = String(b.result?.sanctions?.length || 0);
          break;
        default:
          aVal = "";
          bVal = "";
      }

      const cmp = aVal.localeCompare(bVal);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir, filter]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = () => {
    const header = "Query,Status,LEI Status,VAT Valid,Sanctions Matches\n";
    const rows = items
      .map((item) => {
        const lei = item.result?.lei?.entityStatus || "N/A";
        const vat =
          item.result?.vat?.isValid === true
            ? "Yes"
            : item.result?.vat?.isValid === false
              ? "No"
              : "N/A";
        const sanctions = item.result?.sanctions?.length || 0;
        return `"${item.query}","${item.status}","${lei}","${vat}","${sanctions}"`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entity-check-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-text-tertiary">
        <p className="text-sm">No results yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(["all", "complete", "error"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3.5 py-1.5 text-[13px] font-medium rounded-full transition-all duration-200 ${
                filter === f
                  ? f === "complete"
                    ? "bg-success-soft text-success"
                    : f === "error"
                      ? "bg-danger-soft text-danger"
                      : "bg-accent-soft text-accent"
                  : "text-text-secondary hover:text-text"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)} ({items.filter((i) => f === "all" || i.status === f).length})
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="flex items-center gap-2 px-4 py-2 text-[13px] font-medium rounded-full border border-border text-text-secondary hover:text-text hover:border-text-tertiary transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Export CSV
        </button>
      </div>

      <div className="bg-bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              {([
                ["query", "Query"],
                ["status", "Status"],
                ["lei", "LEI"],
                ["vat", "VAT"],
                ["sanctions", "Sanctions"],
              ] as const).map(([key, label]) => (
                <th
                  key={key}
                  onClick={() => toggleSort(key)}
                  className="text-left px-5 py-4 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-secondary transition-colors"
                >
                  {label}
                  {sortKey === key && (
                    <span className="ml-1 text-accent">{sortDir === "asc" ? "\u2191" : "\u2193"}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((item, idx) => (
              <tr
                key={`${item.query}-${idx}`}
                className="border-b border-border-subtle last:border-0 hover:bg-accent-soft/30 transition-colors"
              >
                <td className="px-5 py-4 font-mono text-xs text-text">{item.query}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${item.status === "complete" ? "text-success" : "text-danger"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === "complete" ? "bg-success" : "bg-danger"}`} />
                    {item.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-text-secondary">
                  {item.result?.lei ? item.result.lei.entityStatus : "\u2014"}
                </td>
                <td className="px-5 py-4 text-xs text-text-secondary">
                  {item.result?.vat?.isValid === true
                    ? "Valid"
                    : item.result?.vat?.isValid === false
                      ? "Invalid"
                      : "\u2014"}
                </td>
                <td className="px-5 py-4 text-xs">
                  {item.result?.sanctions && item.result.sanctions.length > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-warning font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning" />
                      {item.result.sanctions.length}
                    </span>
                  ) : (
                    <span className="text-text-tertiary">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
