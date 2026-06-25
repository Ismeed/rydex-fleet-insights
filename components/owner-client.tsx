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
import { compactNaira, naira } from "@/lib/format";
import { ClipboardList, Sparkles, Activity } from "lucide-react";

interface OwnerClientProps {
  user: { name: string; role: string };
  kpis: {
    totalOwned: number;
    activeCount: number;
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    avgRevenuePerHour: number;
    avgRevenuePerKm: number;
    totalCodes: number;
    redeemedCodes: number;
    engagementRate: number;
  };
  revenue30d: Array<{ label: string; revenue: number }>;
  vehiclesList: any[];
  recentActivity: any[];
}

export function OwnerClient({
  user,
  kpis,
  revenue30d,
  vehiclesList,
  recentActivity,
}: OwnerClientProps) {
  return (
    <AppShell
      title="Investor Dashboard"
      description="Rydex Mobility Partner • Owned fleet performance"
      user={user}
    >
      {/* KPI grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label="Vehicles Owned"
          value={kpis.totalOwned}
          badge={{ label: `${kpis.activeCount} Active`, tone: "brand" }}
        />
        <KpiCard
          label="Today's Revenue"
          value={compactNaira(kpis.todayRevenue)}
          badge={{ label: "Live", tone: "brand" }}
        />
        <KpiCard
          label="This Month"
          value={compactNaira(kpis.monthlyRevenue)}
          delta={{ value: 12 }}
          delayMs={60}
        />
        <KpiCard
          label="Reward Engagement"
          value={`${kpis.engagementRate}%`}
          badge={{ label: `${kpis.redeemedCodes}/${kpis.totalCodes} Redeemed`, tone: "brand" }}
          delayMs={120}
        />
      </section>

      {/* Analytics row */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Revenue Performance Chart */}
        <div
          className="xl:col-span-2 animate-fade-up bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-start justify-between mb-6 gap-4">
            <div className="min-w-0">
              <h4 className="text-base sm:text-lg font-bold">Revenue Performance</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Last 30 days aggregate across your owned vehicles
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenue30d} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rydexOwnerRev" x1="0" y1="0" x2="0" y2="1">
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
                  fill="url(#rydexOwnerRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Owned Fleet Stats Summary */}
        <div
          className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
          style={{ animationDelay: "180ms" }}
        >
          <div>
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Sparkles className="size-4 text-brand" /> Efficiency Statistics
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">Revenue per Hour</span>
                <span className="text-sm font-mono font-bold">{naira(kpis.avgRevenuePerHour)}/hr</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">Revenue per Kilometer</span>
                <span className="text-sm font-mono font-bold">{naira(kpis.avgRevenuePerKm)}/km</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">Weekly Revenue</span>
                <span className="text-sm font-mono font-bold">{naira(kpis.weeklyRevenue)}</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-brand-soft/45 border border-brand/15 rounded-lg text-xs mt-4 text-brand-dark">
            <p className="font-bold text-brand flex items-center gap-1">Partner Notice</p>
            <p className="text-foreground/70 mt-1 leading-relaxed">
              These metrics only represent vehicles associated with your investor profile. Platform-wide averages are hidden to preserve data boundaries.
            </p>
          </div>
        </div>
      </section>

      {/* Fleet table & Recent Activity */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Owned Vehicles Registry */}
        <div
          className="xl:col-span-2 animate-fade-up bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm"
          style={{ animationDelay: "240ms" }}
        >
          <h3 className="font-bold text-base mb-4">Your Owned Fleet</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                  <th className="px-4 py-2">Vehicle ID</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Fuel Type</th>
                  <th className="px-4 py-2">Total Distance</th>
                  <th className="px-4 py-2">Total Revenue</th>
                  <th className="px-4 py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vehiclesList.map((v) => (
                  <tr key={v.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-brand">
                      {v.id.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{v.assignedDriver?.name || "None"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-brand/5 text-brand text-[10px] font-bold rounded">
                        {v.fuelType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {v.totalDistance?.toFixed(1) || "0.0"} KM
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-brand">
                      {naira(v.totalRevenue || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                          v.status === "ACTIVE"
                            ? "bg-brand/10 text-brand"
                            : v.status === "MAINTENANCE"
                            ? "bg-warn-soft text-warn"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {v.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div 
          className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div>
            <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">
              <Activity className="size-4.5 text-brand" /> Recent Fleet Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent shift activity recorded.</p>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="size-8 rounded-full bg-brand/10 text-brand grid place-items-center shrink-0">
                      <ClipboardList className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-foreground truncate block">
                          {act.driverName} ({act.vehicleId.toUpperCase()})
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                          {new Date(act.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        Completed shift: <span className="font-semibold text-foreground">{act.distanceCovered.toFixed(1)} KM</span>
                      </p>
                      <p className="font-semibold text-brand mt-0.5">
                        Revenue: {naira(act.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
