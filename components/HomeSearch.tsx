"use client";

import { useRef } from "react";
import SearchBar, { SearchBarHandle } from "./SearchBar";

const samples = [
  { label: "Apple Inc.", q: "Apple Inc." },
  { label: "Apple's LEI", q: "HWUPKR0MPOU8FGXBT394" },
  { label: "SAP's VAT", q: "DE143454214" },
];

export default function HomeSearch() {
  const searchRef = useRef<SearchBarHandle>(null);

  return (
    <>
      <SearchBar ref={searchRef} />
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-faint">Try:</span>
        {samples.map((sample) => (
          <button
            key={sample.q}
            type="button"
            onClick={() => searchRef.current?.runSample(sample.q)}
            className="text-xs px-2.5 py-1 rounded-sm border border-hairline text-muted hover:text-brass hover:border-brass transition-colors"
          >
            {sample.label}
          </button>
        ))}
      </div>
    </>
  );
}
