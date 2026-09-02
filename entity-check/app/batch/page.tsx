"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import BatchTable from "@/components/BatchTable";
import { BatchItem } from "@/lib/types";

export default function BatchPage() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputText, setInputText] = useState("");

  const processBatch = useCallback(async (text: string) => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: lines }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items);
      }
    } catch {
      setItems(lines.map((q) => ({ query: q, status: "error" as const, error: "Network error" })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get("q");
    if (q) {
      setInputText(q);
      processBatch(q);
    }
  }, [processBatch]);

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border-subtle bg-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span className="text-[17px] font-bold text-text tracking-tight">Entity Check</span>
          </Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-all">
              Single Check
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="space-y-8">
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold text-text tracking-tight mb-1">Batch Check</h1>
            <p className="text-[15px] text-text-secondary">
              Paste up to 50 entities, one per line. Each checked against all three sources.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              processBatch(inputText);
            }}
            className="space-y-4 animate-slide-up"
            style={{ animationDelay: "100ms", animationFillMode: "both" }}
          >
            <div className="bg-bg-card rounded-2xl shadow-lg shadow-black/5 dark:shadow-black/20 border border-border p-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={"Paste one entity per line\nCompany names, LEI numbers, or VAT numbers"}
                rows={8}
                className="w-full px-4 py-3 text-[15px] text-text placeholder:text-text-tertiary bg-transparent border-none outline-none resize-none leading-relaxed"
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-text-secondary">
                {inputText.split("\n").filter((l) => l.trim()).length} / 50 entities
              </span>
              <button
                type="submit"
                disabled={loading || !inputText.trim() || inputText.split("\n").filter((l) => l.trim()).length > 50}
                className="px-7 py-3 bg-accent hover:bg-accent-hover disabled:bg-text-tertiary disabled:shadow-none disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-md shadow-accent/25 transition-all duration-200 text-sm"
              >
                {loading ? "Processing..." : "Run Batch Check"}
              </button>
            </div>
          </form>

          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3 text-text-secondary">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" />
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse-dot" style={{ animationDelay: "300ms" }} />
                </div>
                <span className="text-sm">Checking entities...</span>
              </div>
            </div>
          )}

          {!loading && items.length > 0 && <BatchTable items={items} />}
        </div>
      </main>
    </div>
  );
}
