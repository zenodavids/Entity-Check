"use client";

import { forwardRef, useImperativeHandle, useState } from "react";
import { useRouter } from "next/navigation";

export interface SearchBarHandle {
  runSample: (query: string) => void;
}

const SearchBar = forwardRef<SearchBarHandle>(function SearchBar(_, ref) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [pinging, setPinging] = useState(false);
  const router = useRouter();

  const submit = (q: string) => {
    if (q.trim()) {
      router.push(`/check/${encodeURIComponent(q.trim())}`);
    }
  };

  useImperativeHandle(ref, () => ({
    runSample: (sampleQuery: string) => {
      setQuery(sampleQuery);
      setPinging(true);
      setTimeout(() => submit(sampleQuery), 550);
    },
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      <div
        className={`flex items-end gap-4 border-b transition-colors ${
          focused || pinging ? "border-brass" : "border-hairline"
        }`}
      >
        <div className="flex-1 pb-3">
          <label className="block text-xs text-faint mb-1.5">
            Company name, LEI code, or VAT number
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. Helvetia Trust Partners"
            readOnly={pinging}
            className="w-full bg-transparent text-lg text-ivory placeholder-faint/70 focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={pinging}
          className={`mb-3 shrink-0 px-4 py-2 text-sm text-ink bg-brass rounded-sm hover:bg-brass-dim transition-colors font-medium disabled:opacity-80 ${
            pinging ? "animate-pulse" : ""
          }`}
        >
          {pinging ? "Verifying…" : "Verify"}
        </button>
      </div>
      <p className="mt-3 text-xs text-faint">
        Sanctions (OFAC SDN, UK) · Legal entity identifiers (GLEIF) · VAT status
        (EU VIES)
      </p>
    </form>
  );
});

export default SearchBar;
