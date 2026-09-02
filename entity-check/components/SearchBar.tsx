"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isBatch, setIsBatch] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const router = useRouter();

  const handleSingleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;
      router.push(`/check/${encodeURIComponent(trimmed)}`);
    },
    [query, router]
  );

  const handleBatchSearch = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const lines = batchInput.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) return;
      router.push(`/batch?q=${encodeURIComponent(lines.join("\n"))}`);
    },
    [batchInput, router]
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setIsBatch(false)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            !isBatch
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "text-text-secondary hover:text-text dark:text-text-secondary dark:hover:text-text"
          }`}
        >
          Single Check
        </button>
        <button
          type="button"
          onClick={() => setIsBatch(true)}
          className={`px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
            isBatch
              ? "bg-accent text-white shadow-md shadow-accent/20"
              : "text-text-secondary hover:text-text dark:text-text-secondary dark:hover:text-text"
          }`}
        >
          Batch Check
        </button>
      </div>

      {!isBatch ? (
        <form onSubmit={handleSingleSearch}>
          <div className="flex items-center bg-bg-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-border p-2 transition-all duration-300 hover:shadow-xl hover:shadow-black/8 dark:hover:shadow-black/25">
            <div className="flex-1 flex items-center gap-3 px-4">
              <svg className="w-5 h-5 text-text-tertiary flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Company name, LEI, or VAT number..."
                className="flex-1 py-3 text-[15px] text-text placeholder:text-text-tertiary bg-transparent border-none outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={!query.trim()}
              className="px-7 py-3 bg-accent hover:bg-accent-hover disabled:bg-text-tertiary disabled:shadow-none disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-accent/25 transition-all duration-200 text-sm"
            >
              Search
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleBatchSearch} className="space-y-4">
          <div className="bg-bg-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-border p-2">
            <textarea
              value={batchInput}
              onChange={(e) => setBatchInput(e.target.value)}
              placeholder={"Paste one entity per line\nCompany names, LEI numbers, or VAT numbers"}
              rows={6}
              className="w-full px-4 py-3 text-[15px] text-text placeholder:text-text-tertiary bg-transparent border-none outline-none resize-none leading-relaxed"
            />
          </div>
          <div className="flex items-center justify-between px-1">
            <span className="text-sm text-text-secondary">
              {batchInput.split("\n").filter((l) => l.trim()).length} / 50 entities
            </span>
            <button
              type="submit"
              disabled={
                !batchInput.trim() ||
                batchInput.split("\n").filter((l) => l.trim()).length > 50
              }
              className="px-7 py-3 bg-accent hover:bg-accent-hover disabled:bg-text-tertiary disabled:shadow-none disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-accent/25 transition-all duration-200 text-sm"
            >
              Run Batch Check
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
