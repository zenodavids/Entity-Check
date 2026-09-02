"use client";

import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

interface Props {
  active?: "home" | "batch";
}

export default function Header({ active }: Props) {
  const router = useRouter();

  return (
    <header className="border-b border-hairline bg-panel/80 backdrop-blur supports-[backdrop-filter]:bg-panel/60 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-3 group"
        >
          <span className="w-8 h-8 rounded-full border border-brass-dim flex items-center justify-center shrink-0 group-hover:border-brass transition-colors">
            <span className="font-serif text-[13px] text-brass leading-none">
              EC
            </span>
          </span>
          <span className="font-sans text-[15px] font-medium text-ivory tracking-tight">
            Entity Check
          </span>
        </button>

        <nav className="flex items-center gap-6">
          <a
            href="/batch"
            className={`text-sm transition-colors ${
              active === "batch" ? "text-brass" : "text-muted hover:text-ivory"
            }`}
          >
            Batch verification
          </a>
          <span className="w-px h-4 bg-hairline" />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
