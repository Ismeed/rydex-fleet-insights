"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Calendar } from "lucide-react";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = searchParams.get("period") || "monthly"; // Default to monthly for better charts density
  const currentStart = searchParams.get("start") || "";
  const currentEnd = searchParams.get("end") || "";

  const [start, setStart] = useState(currentStart);
  const [end, setEnd] = useState(currentEnd);

  const updateFilter = (period: string, sDate = start, eDate = end) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", period);
    if (period === "custom") {
      if (sDate) params.set("start", sDate);
      else params.delete("start");
      if (eDate) params.set("end", eDate);
      else params.delete("end");
    } else {
      params.delete("start");
      params.delete("end");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-white border border-border rounded-xl p-4 mb-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-up">
      <div className="flex flex-wrap gap-1.5 items-center">
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 flex items-center gap-1">
          <Calendar className="size-3.5" />
          Filter Period:
        </span>
        {[
          { value: "daily", label: "Today" },
          { value: "yesterday", label: "Yesterday" },
          { value: "weekly", label: "This Week" },
          { value: "monthly", label: "This Month" },
          { value: "quarterly", label: "This Quarter" },
          { value: "yearly", label: "This Year" },
          { value: "custom", label: "Custom Range" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => updateFilter(p.value)}
            className={`px-3 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
              currentPeriod === p.value
                ? "bg-brand text-white shadow-sm"
                : "bg-surface hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {currentPeriod === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={start}
            onChange={(e) => {
              setStart(e.target.value);
              updateFilter("custom", e.target.value, end);
            }}
            className="px-2.5 py-1.5 bg-surface border border-border rounded text-xs font-mono focus:ring-1 focus:ring-brand outline-none"
          />
          <span className="text-xs text-muted-foreground">to</span>
          <input
            type="date"
            value={end}
            onChange={(e) => {
              setEnd(e.target.value);
              updateFilter("custom", start, e.target.value);
            }}
            className="px-2.5 py-1.5 bg-surface border border-border rounded text-xs font-mono focus:ring-1 focus:ring-brand outline-none"
          />
        </div>
      )}
    </div>
  );
}
