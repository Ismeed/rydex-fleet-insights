"use client";

import Link from "next/link";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { FilterBar } from "@/components/filter-bar";
import { compactNaira, naira } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useState, useEffect, useTransition } from "react";
import { deliverRewardAction } from "@/app/actions";
import { toast } from "sonner";
import { Plus, Check, ArrowRight } from "lucide-react";

interface DashboardClientProps {
  user: { name: string; role: string };
  kpis: {
    todayRevenue: number;
    activeVehicles: number;
    totalVehicles: number;
    avgRevenuePerKm: number;
    codesRedeemedToday: number;
    totalPassengers: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    avgRevenuePerHour: number;
    avgRevenuePerVehicle: number;
  };
  revenue30d: Array<{ label: string; revenue: number }>;
  pendingRedemptions: any[];
  topVehicles: any[];
  activeShifts: any[];
  period: string;
}

export function DashboardClient({
  user,
  kpis,
  revenue30d,
  pendingRedemptions: initialPending,
  topVehicles,
  activeShifts,
  period,
}: DashboardClientProps) {
  const [pending, setPending] = useState(initialPending);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleApprove = async (id: string) => {
    startTransition(async () => {
      const res = await deliverRewardAction(id);
      if (res.success) {
        toast.success("Reward approved & marked delivered!");
        setPending((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(res.error || "Failed to approve reward");
      }
    });
  };

  return (
    <AppShell
      title="Fleet Overview"
      description="CityView CNG Automobile Synergy • Live operations"
      user={user}
    >
      <FilterBar />

      {/* KPI grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label={
            period === "daily"
              ? "Today's Revenue"
              : period === "yesterday"
              ? "Yesterday's Revenue"
              : period === "weekly"
              ? "Weekly Revenue"
              : period === "monthly"
              ? "Monthly Revenue"
              : period === "quarterly"
              ? "Quarterly Revenue"
              : period === "yearly"
              ? "Yearly Revenue"
              : "Period Revenue"
          }
          value={compactNaira(kpis.todayRevenue)}
          delta={{ value: 12 }}
        />
        <KpiCard
          label="Active Vehicles"
          value={
            <>
              {kpis.activeVehicles}
              <span className="text-muted-foreground/40 text-sm">/{kpis.totalVehicles}</span>
            </>
          }
          badge={{ label: "Live", tone: "brand" }}
          delayMs={60}
        />
        <KpiCard
          label="Avg Revenue / KM"
          value={compactNaira(kpis.avgRevenuePerKm)}
          delta={{ value: 7 }}
          delayMs={120}
        />
        <KpiCard
          label="Codes Redeemed"
          value={kpis.codesRedeemedToday}
          hint="Total Redeemed"
          delayMs={180}
        />
      </section>

      {/* Analytics row */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div
          className="xl:col-span-2 animate-fade-up bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm"
          style={{ animationDelay: "240ms" }}
        >
          <div className="flex items-start justify-between mb-6 gap-4">
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-bold">Revenue Performance</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Aggregate across fleet for the selected period
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="size-3 rounded-full bg-brand" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Naira (₦)
              </span>
            </div>
          </div>
          <div className="h-56 sm:h-64 -ml-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue30d} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="muvaRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F8A5F" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#0F8A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#64748B" }}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => `₦${Math.round(v / 1000)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      border: "1px solid #E2E8F0",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [naira(v), "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F8A5F"
                    strokeWidth={2}
                    fill="url(#muvaRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div
            className="animate-fade-up bg-charcoal text-white rounded-xl p-5 sm:p-6 shadow-md"
            style={{ animationDelay: "320ms" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
                Pending Approvals
              </h4>
              <Link href="/rewards" className="text-[10px] text-brand-accent font-semibold hover:underline">
                VIEW ALL
              </Link>
            </div>
            <div className="space-y-4">
              {pending.length > 0 ? (
                pending.slice(0, 3).map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-3 border-b border-white/5 pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{r.passenger?.name || "Passenger"}</p>
                      <p className="text-[10px] text-white/40 truncate">
                        {r.pointsUsed} pts → {r.rewardRequested}
                      </p>
                    </div>
                    <button
                      onClick={() => handleApprove(r.id)}
                      disabled={isPending}
                      className="px-3 py-1 bg-brand-accent text-charcoal text-[10px] font-bold rounded hover:opacity-90 transition-opacity shrink-0 flex items-center gap-1 disabled:opacity-50"
                    >
                      <Check className="size-3" /> Approve
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/40 py-2">No pending reward approvals</p>
              )}
            </div>
          </div>

          <div
            className="animate-fade-up bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm"
            style={{ animationDelay: "380ms" }}
          >
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Top Performing Vehicles
            </h4>
            <div className="space-y-3">
              {topVehicles.length > 0 ? (
                topVehicles.slice(0, 4).map((v, i) => (
                  <div key={v.id} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono font-bold text-muted-foreground w-4">
                        #{i + 1}
                      </span>
                      <Link href={`/vehicles/${v.id}`} className="text-sm font-mono font-semibold hover:text-brand truncate">
                        {v.id.toUpperCase()}
                      </Link>
                    </div>
                    <span className="text-sm font-mono font-bold text-right">
                      {naira(v.revenue)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">No shift revenue logged today</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Live Active Shifts */}
      <section
        className="animate-fade-up bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm"
        style={{ animationDelay: "440ms" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base">Active Shifts Overview</h3>
            <p className="text-xs text-muted-foreground">Vehicles currently out driving for CityView</p>
          </div>
          <Link href="/shifts" className="text-xs text-brand font-semibold hover:underline flex items-center gap-1">
            Manage Shifts <ArrowRight className="size-3" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-4 py-2">Vehicle ID</th>
                <th className="px-4 py-2">Driver</th>
                <th className="px-4 py-2">Start Time</th>
                <th className="px-4 py-2">Odometer</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activeShifts.length > 0 ? (
                activeShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-brand">
                      <Link href={`/vehicles/${s.vehicleId}`}>{s.vehicleId.toUpperCase()}</Link>
                    </td>
                    <td className="px-4 py-3">{s.driver?.name || "Unassigned"}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {new Date(s.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-mono">{s.startOdometer} KM</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                          s.status === "ACTIVE" ? "bg-brand/10 text-brand" : "bg-danger-soft text-danger"
                        )}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-xs text-muted-foreground">
                    No active morning shifts. Go to Shift Operations to start one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
