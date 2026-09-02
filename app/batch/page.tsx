"use client";

import { useState } from "react";
import BatchTable from "@/components/BatchTable";
import Header from "@/components/Header";

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

export default function BatchPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<BatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const lineCount = input.split("\n").filter((l) => l.trim().length > 0).length;

  const sampleBatch = [
    "Apple Inc.",
    "HWUPKR0MPOU8FGXBT394",
    "SAP SE",
    "DE143454214",
    "Northwind Trading Co.",
  ].join("\n");

  const handleLoadSample = () => {
    setInput(sampleBatch);
    setError("");
  };

  const handleCheck = async () => {
    const queries = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (queries.length === 0) {
      setError("Enter at least one query.");
      return;
    }
    if (queries.length > 50) {
      setError("Maximum 50 queries per batch.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const res = await fetch("/api/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Batch request failed (${res.status})`);
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The batch check timed out. Try fewer entries, or try again.");
      } else {
        setError(err instanceof Error ? err.message : "Unknown error");
      }
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink text-ivory">
      <Header active="batch" />

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8 max-w-xl">
          <h1 className="font-serif text-3xl text-ivory mb-2">
            Batch verification
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Check multiple entities in one pass — the same three live registries
            as a single lookup, run against a whole list.
          </p>
        </div>

        <div className="mb-8 max-w-2xl border border-hairline rounded-sm divide-y divide-hairline-soft">
          {[
            {
              n: "01",
              t: "One entry per line",
              d: "Company names, LEI codes, and VAT numbers can be mixed freely in the same list.",
            },
            {
              n: "02",
              t: "Up to 50 per run",
              d: "Each line is checked independently against sanctions, LEI, and VAT sources.",
            },
            {
              n: "03",
              t: "Run, then filter",
              d: "Once results load, filter to Flagged only, sort any column, or export the full set to CSV.",
            },
          ].map((s) => (
            <div key={s.n} className="flex items-start gap-4 px-4 py-3">
              <span className="text-xs font-mono text-brass shrink-0 pt-0.5">
                {s.n}
              </span>
              <div>
                <p className="text-sm text-ivory font-medium">{s.t}</p>
                <p className="text-xs text-muted mt-0.5">{s.d}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-3 flex items-center justify-between max-w-2xl">
          <span className="text-xs text-faint">
            Paste your own list below, or:
          </span>
          <button
            onClick={handleLoadSample}
            className="text-xs px-3 py-1.5 border border-hairline rounded-sm text-muted hover:text-brass hover:border-brass transition-colors"
          >
            Load sample data
          </button>
        </div>

        <div
          className={`border-b transition-colors ${
            loading
              ? "border-hairline"
              : "border-hairline focus-within:border-brass"
          }`}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              "Acme Corp\nDE123456789\n529900F8ZHWFLB1PG5721\nApple Inc."
            }
            rows={8}
            className="w-full bg-transparent text-sm text-ivory placeholder-faint/70 focus:outline-none resize-none font-mono py-3"
          />
        </div>

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-ink bg-brass rounded-sm hover:bg-brass-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Checking…" : "Run batch check"}
          </button>
          <span className="text-xs text-faint font-mono">
            {lineCount}/50 {lineCount === 1 ? "entry" : "entries"}
          </span>
          {error && <span className="text-sm text-flag">{error}</span>}
        </div>

        {results.length > 0 && (
          <div className="mt-10 animate-rise">
            <BatchTable results={results} />
          </div>
        )}
      </main>
    </div>
  );
}
