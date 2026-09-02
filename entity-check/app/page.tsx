import SearchBar from "@/components/SearchBar";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bg">
      {/* Hero Section with gradient */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-pink-500/5 dark:from-accent/10 dark:via-transparent dark:to-pink-500/10" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-accent/8 to-transparent dark:from-accent/15 rounded-full blur-3xl" />

        <header className="relative z-10 max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center shadow-lg shadow-accent/30">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <span className="text-[17px] font-bold text-text tracking-tight">Entity Check</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-24">
          <div className="text-center space-y-6 mb-12 animate-fade-in">
            <h1 className="text-[48px] font-bold text-text tracking-tight leading-[1.1]">
              What does the public
              <br />
              record say?
            </h1>
            <p className="text-text-secondary text-[17px] max-w-lg mx-auto leading-relaxed">
              One search. Three independent checks. Sourced facts from public registries.
            </p>
          </div>

          <div className="animate-slide-up" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
            <SearchBar />
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-[13px] text-text-tertiary animate-slide-up" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            <span>No API keys</span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary/40" />
            <span>No accounts</span>
            <span className="w-1 h-1 rounded-full bg-text-tertiary/40" />
            <span>Facts only</span>
          </div>
        </main>
      </div>

      {/* Features Section */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-3 gap-5 animate-slide-up" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
          <FeatureCard
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            }
            title="Sanctions"
            description="OFAC SDN + UK Sanctions List fuzzy matching"
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
            title="LEI Status"
            description="GLEIF registration status and entity details"
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            }
            title="VAT Validity"
            description="EU VIES cross-border VAT validation"
          />
        </div>

        <div className="mt-16 text-center space-y-3">
          <p className="text-[13px] text-text-tertiary">
            Data:{" "}
            <a href="https://search.gleif.org" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors">GLEIF</a>
            {" "}&middot;{" "}
            <a href="https://www.treasury.gov/ofac" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors">OFAC</a>
            {" "}&middot;{" "}
            <a href="https://sanctionslist.fcdo.gov.uk" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors">UK Sanctions</a>
            {" "}&middot;{" "}
            <a href="https://ec.europa.eu/taxation_customs/vies" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-accent transition-colors">EU VIES</a>
          </p>
          <p className="text-[11px] text-text-tertiary/60">
            EU consolidated sanctions not included (token-gated).{" "}
            <a href="https://www.opensanctions.org" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-text-secondary transition-colors">OpenSanctions</a>{" "}
            for EU coverage.
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-bg-card rounded-2xl border border-border p-5 space-y-3 hover:shadow-md hover:border-accent/20 transition-all duration-300 group">
      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="font-semibold text-text text-[15px] tracking-tight">{title}</h3>
      <p className="text-[13px] text-text-tertiary leading-relaxed">{description}</p>
    </div>
  );
}
