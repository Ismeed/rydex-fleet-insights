import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: ReactNode;
  delta?: { value: number; isNegative?: boolean };
  badge?: { label: string; tone: "brand" | "warn" | "danger" | "muted" };
  hint?: string;
  delayMs?: number;
}

export function KpiCard({
  label,
  value,
  delta,
  badge,
  hint,
  delayMs = 0,
}: KpiCardProps) {
  const badgeTones = {
    brand: "bg-brand/10 text-brand",
    warn: "bg-warn-soft text-warn",
    danger: "bg-danger-soft text-danger",
    muted: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className="animate-fade-up bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-w-0"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">
          {label}
        </span>
        {badge && (
          <span
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
              badgeTones[badge.tone] || "bg-muted"
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-mono">
          {value}
        </span>
      </div>

      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-1.5 text-xs">
          {delta && (
            <span
              className={cn(
                "font-semibold font-mono",
                delta.isNegative || delta.value < 0 ? "text-danger" : "text-brand-accent"
              )}
            >
              {delta.value > 0 ? "↑" : delta.value < 0 ? "↓" : ""} {Math.abs(delta.value)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground font-medium">{hint}</span>}
          {delta && <span className="text-muted-foreground">vs last week</span>}
        </div>
      )}
    </div>
  );
}
