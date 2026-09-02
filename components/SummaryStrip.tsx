interface Props {
  leiFound: boolean;
  vatFound: boolean;
  sanctionsCount: number;
}

export default function SummaryStrip({ leiFound, vatFound, sanctionsCount }: Props) {
  const items = [
    {
      label: "LEI",
      ok: leiFound,
    },
    {
      label: "VAT",
      ok: vatFound,
    },
    {
      label: "Sanctions",
      ok: sanctionsCount === 0,
      count: sanctionsCount,
    },
  ];

  return (
    <div className="flex items-center gap-4 text-xs">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              item.ok ? "bg-green-500" : (item.count ?? 0) > 0 ? "bg-red-500" : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-400">
            {item.label}
            {item.count !== undefined && item.count > 0 && ` (${item.count})`}
          </span>
        </div>
      ))}
    </div>
  );
}
