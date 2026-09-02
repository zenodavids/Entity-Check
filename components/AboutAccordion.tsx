"use client";

import { useState } from "react";

export default function AboutAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8 max-w-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-muted hover:text-brass transition-colors"
        aria-expanded={open}
      >
        <span
          className={`inline-block transition-transform duration-200 ${open ? "rotate-90" : ""}`}
        >
          ›
        </span>
        What is this, exactly?
      </button>

      {open && (
        <div className="mt-3 pl-4 border-l border-hairline text-sm text-muted leading-relaxed space-y-3 animate-rise">
          <p>
            Entity Check looks up a company or person against three public
            registries at once: the US and UK sanctions lists, the global LEI
            database, and the EU&apos;s VAT registry.
          </p>
          <p>
            Enter a name, an LEI code, or a VAT number. Each result is fetched
            live and shown on its own — no combined score, no
            &quot;cleared&quot; or &quot;blocked&quot; verdict, and no ownership
            data. A sanctions result is a possible name match, not a finding of
            fact — it&apos;s flagged for your own review, with the confidence
            score shown.
          </p>
          <p>Nothing you search is stored. No account, no history.</p>
        </div>
      )}
    </div>
  );
}
