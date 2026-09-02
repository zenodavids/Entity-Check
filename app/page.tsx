import Header from "@/components/Header";
import AboutAccordion from "@/components/AboutAccordion";
import HomeSearch from "@/components/HomeSearch";

const checks = [
  {
    title: "Sanctions screening",
    detail:
      "OFAC SDN and UK Sanctions List, cross-referenced with fuzzy name matching.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.3}
          d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582"
        />
      </svg>
    ),
  },
  {
    title: "Legal entity identifier",
    detail: "Registration record from GLEIF, the global LEI reference source.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.3}
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: "VAT validity",
    detail:
      "Live status from the EU's VIES system, including registered address where available.",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.3}
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
        />
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-ink text-ivory">
      <Header active="home" />

      <main className="max-w-5xl mx-auto px-6">
        <div className="pt-20 pb-16 max-w-2xl animate-rise">
          <h1 className="font-serif text-[2.75rem] leading-[1.1] text-ivory mb-5">
            What does the public record say about them?
          </h1>
          <p className="text-base text-muted leading-relaxed mb-10">
            Three independent registries, checked in parallel. No scoring, no
            aggregation. Just the sourced facts, so your team can form its own
            judgment.
          </p>
          <AboutAccordion />

          <HomeSearch />
        </div>

        <div className="border-t border-hairline">
          {checks.map((check) => (
            <div
              key={check.title}
              className="flex items-start gap-5 py-6 border-b border-hairline-soft"
            >
              <div className="text-brass mt-0.5 shrink-0">{check.icon}</div>
              <div>
                <h3 className="text-[15px] font-medium text-ivory">
                  {check.title}
                </h3>
                <p className="text-sm text-muted mt-1 max-w-md">
                  {check.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="py-14 max-w-lg">
          <p className="text-xs text-faint leading-relaxed">
            This tool does not provide beneficial-ownership data or EU sanctions
            data, and it does not combine results into a risk score. Each
            finding is sourced independently so verify against the original
            registry before relying on it.
          </p>
        </div>
      </main>
    </div>
  );
}
