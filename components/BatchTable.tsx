/* eslint-disable react-hooks/static-components */
"use client";

import { Fragment, useState } from "react";

interface BatchResult {
  query: string;
  type: string;
  lei: {
    lei: string;
    legalName: string;
    status: string;
    legalJurisdiction?: string;
  } | null;
  vat: {
    countryCode: string;
    vatNumber: string;
    valid: boolean;
    companyName?: string;
    timedOut?: boolean;
    error?: string;
  } | null;
  sanctions: {
    source: string;
    matchedName: string;
    score: number;
    entryType?: string;
    programs?: string[];
  }[];
}

interface Props {
  results: BatchResult[];
}

type SortKey = "query" | "type" | "leiStatus" | "vatValid" | "sanctionsCount";
type FilterMode = "all" | "flagged" | "clear";

export default function BatchTable({ results }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("query");
  const [sortAsc, setSortAsc] = useState(true);
  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState<FilterMode>("all");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const filtered = results
    .filter(
      (r) =>
        r.query.toLowerCase().includes(filter.toLowerCase()) ||
        r.lei?.legalName?.toLowerCase().includes(filter.toLowerCase()) ||
        r.vat?.companyName?.toLowerCase().includes(filter.toLowerCase()),
    )
    .filter((r) => {
      if (mode === "all") return true;
      const flagged = r.sanctions.length > 0;
      return mode === "flagged" ? flagged : !flagged;
    });

  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case "query":
        cmp = a.query.localeCompare(b.query);
        break;
      case "type":
        cmp = a.type.localeCompare(b.type);
        break;
      case "leiStatus":
        cmp = (a.lei?.status || "").localeCompare(b.lei?.status || "");
        break;
      case "vatValid":
        cmp = Number(a.vat?.valid) - Number(b.vat?.valid);
        break;
      case "sanctionsCount":
        cmp = a.sanctions.length - b.sanctions.length;
        break;
    }
    return sortAsc ? cmp : -cmp;
  });

  const flaggedCount = results.filter((r) => r.sanctions.length > 0).length;

  const handleExport = () => {
    const headers = [
      "Query",
      "Type",
      "LEI Status",
      "Legal Name",
      "VAT Valid",
      "Sanctions Matches",
    ];
    const rows = sorted.map((r) => [
      r.query,
      r.type,
      r.lei?.status || "",
      r.lei?.legalName || "",
      r.vat ? (r.vat.valid ? "Valid" : "Invalid") : "",
      String(r.sanctions.length),
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entity-check-batch-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortHeader = ({
    label,
    sortKeyName,
  }: {
    label: string;
    sortKeyName: SortKey;
  }) => (
    <button
      onClick={() => handleSort(sortKeyName)}
      className="flex items-center gap-1 text-xs text-muted hover:text-brass transition-colors"
    >
      {label}
      {sortKey === sortKeyName && (
        <span className="text-brass">{sortAsc ? "↑" : "↓"}</span>
      )}
    </button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <div className="border-b border-hairline pb-1">
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by name…"
              className="bg-transparent text-sm text-ivory placeholder-faint focus:outline-none w-48"
            />
          </div>
          <div className="flex items-center gap-1 text-xs">
            {(["all", "flagged", "clear"] as FilterMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-2.5 py-1 rounded-sm border transition-colors capitalize ${
                  mode === m
                    ? "border-brass text-brass"
                    : "border-hairline text-muted hover:text-ivory"
                }`}
              >
                {m === "flagged" ? `Flagged (${flaggedCount})` : m}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={handleExport}
          className="text-xs px-3 py-1.5 border border-hairline rounded-sm text-muted hover:text-brass hover:border-brass transition-colors"
        >
          Export CSV
        </button>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-hairline rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-panel-2 border-b border-hairline">
              <th className="text-left px-4 py-3">
                <SortHeader label="Query" sortKeyName="query" />
              </th>
              <th className="text-left px-4 py-3">
                <SortHeader label="Type" sortKeyName="type" />
              </th>
              <th className="text-left px-4 py-3">
                <SortHeader label="LEI" sortKeyName="leiStatus" />
              </th>
              <th className="text-left px-4 py-3">
                <SortHeader label="VAT" sortKeyName="vatValid" />
              </th>
              <th className="text-left px-4 py-3">
                <SortHeader label="Sanctions" sortKeyName="sanctionsCount" />
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const flagged = r.sanctions.length > 0;
              const isOpen = expandedRow === i;
              return (
                <Fragment key={i}>
                  <tr
                    onClick={() => setExpandedRow(isOpen ? null : i)}
                    className="border-b border-hairline-soft last:border-b-0 hover:bg-panel-2/50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-ivory">{r.query}</td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">
                      {r.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={r.lei ? "text-clear" : "text-faint"}>
                        {r.lei ? r.lei.status : "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.vat ? (
                        <span
                          className={r.vat.valid ? "text-clear" : "text-flag"}
                        >
                          {r.vat.valid ? "Valid" : "Invalid"}
                        </span>
                      ) : (
                        <span className="text-faint">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`flex items-center gap-1.5 ${flagged ? "text-flag" : "text-clear"}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${flagged ? "bg-flag" : "bg-clear"}`}
                        />
                        {flagged
                          ? `${r.sanctions.length} match${r.sanctions.length > 1 ? "es" : ""}`
                          : "Clear"}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="bg-panel-2/30 border-b border-hairline-soft">
                      <td colSpan={5} className="px-4 py-4">
                        <div className="grid grid-cols-3 gap-6 text-xs">
                          <div>
                            <p className="text-faint mb-1">LEI record</p>
                            <p className="text-ivory">
                              {r.lei?.legalName || "No record"}
                            </p>
                            {r.lei?.lei && (
                              <p className="text-muted font-mono mt-0.5">
                                {r.lei.lei}
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-faint mb-1">VAT record</p>
                            <p className="text-ivory">
                              {r.vat?.companyName || "No record"}
                            </p>
                          </div>
                          <div>
                            <p className="text-faint mb-1">Sanctions matches</p>
                            {r.sanctions.length > 0 ? (
                              r.sanctions.map((s, j) => (
                                <p key={j} className="text-flag">
                                  {s.matchedName} · {(s.score * 100).toFixed(0)}
                                  %
                                </p>
                              ))
                            ) : (
                              <p className="text-clear">None</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sorted.map((r, i) => {
          const flagged = r.sanctions.length > 0;
          return (
            <div key={i} className="border border-hairline rounded-sm p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-ivory font-medium">{r.query}</p>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${flagged ? "bg-flag" : "bg-clear"}`}
                />
              </div>
              <div className="text-xs text-muted space-y-1">
                <p>LEI: {r.lei?.status || "No record"}</p>
                <p>VAT: {r.vat ? (r.vat.valid ? "Valid" : "Invalid") : "-"}</p>
                <p className={flagged ? "text-flag" : "text-clear"}>
                  Sanctions:{" "}
                  {flagged ? `${r.sanctions.length} match(es)` : "Clear"}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {sorted.length === 0 && (
        <p className="text-center text-sm text-faint py-8">
          No results match this filter.
        </p>
      )}
    </div>
  );
}
