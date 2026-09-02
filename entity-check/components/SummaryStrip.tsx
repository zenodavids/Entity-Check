interface SummaryStripProps {
  leiStatus: "found" | "not-found" | "loading" | "error" | "unavailable";
  vatStatus: "found" | "not-found" | "loading" | "error" | "unavailable";
  sanctionsCount: number;
  sanctionsLoading: boolean;
}

export default function SummaryStrip({
  leiStatus,
  vatStatus,
  sanctionsCount,
  sanctionsLoading,
}: SummaryStripProps) {
  const checks = [
    { label: "LEI", status: leiStatus },
    { label: "VAT", status: vatStatus },
    {
      label: "Sanctions",
      status: sanctionsLoading ? "loading" : sanctionsCount > 0 ? "found" : "not-found",
    },
  ];

  const getDotColor = (status: string) => {
    if (status === "loading") return "bg-accent animate-pulse-dot";
    if (status === "found") return "bg-success";
    if (status === "error" || status === "unavailable") return "bg-warning";
    return "bg-text-tertiary/40";
  };

  return (
    <div className="flex items-center gap-6 px-5 py-3.5 bg-bg-card rounded-2xl border border-border shadow-sm">
      {checks.map((check) => (
        <div key={check.label} className="flex items-center gap-2.5">
          <span className={`w-2 h-2 rounded-full ${getDotColor(check.status)}`} />
          <span className="text-[13px] font-medium text-text-secondary">
            {check.label}
            {check.label === "Sanctions" && !sanctionsLoading && (
              <span className="ml-1 text-text-tertiary">({sanctionsCount})</span>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
