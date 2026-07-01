"use client";

import { useState, useEffect } from "react";
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
import { ClipboardList, Sparkles, Activity, Wrench, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface OwnerClientProps {
  user: { name: string; role: string };
  kpis: {
    totalVehiclesCount: number;
    onRoadCount: number;
    availableCount: number;
    maintenanceCount: number;
    activeDriversCount: number;
    absentDriversCount: number;
    activeContractsCount: number;
    completedContractsCount: number;
    periodRevenue: number;
    outstandingRemittance: number;
    avgRevenuePerHour: number;
    avgRevenuePerKm: number;
    totalDistance: number;
  };
  revenue30d: Array<{ label: string; revenue: number }>;
  vehiclesList: any[];
  recentActivity: any[];
  period: string;
  companyName: string;
  maintenances: any[];
}

export function OwnerClient({
  user,
  kpis,
  revenue30d,
  vehiclesList,
  recentActivity,
  period,
  companyName,
  maintenances,
}: OwnerClientProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <AppShell
      title="Company Console Dashboard"
      description="Fleet performance & Hire Purchase metrics tracker"
      user={user}
      companyName={companyName}
      actions={
        <div className="flex gap-2">
          <Link
            href="/vehicles"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
          >
            Add Vehicle
          </Link>
          <Link
            href="/drivers"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
          >
            Add Driver
          </Link>
        </div>
      }
    >
      <FilterBar />

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
              : "Period Revenue"
          }
          value={compactNaira(kpis.periodRevenue)}
          badge={{ label: "Live Remittances", tone: "brand" }}
        />
        <KpiCard
          label="Outstanding Balance"
          value={compactNaira(kpis.outstandingRemittance)}
          badge={{ 
            label: kpis.outstandingRemittance > 0 ? "Underpaid Remittance" : "Fully Settled", 
            tone: kpis.outstandingRemittance > 0 ? "warn" : "brand" 
          }}
        />
        <KpiCard
          label="Fleet Status"
          value={`${kpis.onRoadCount} / ${kpis.totalVehiclesCount} On Road`}
          badge={{ label: `${kpis.availableCount} Available`, tone: "brand" }}
        />
        <KpiCard
          label="Hire Purchase Agreements"
          value={`${kpis.activeContractsCount} Active`}
          badge={{ label: `${kpis.completedContractsCount} Settled`, tone: "brand" }}
        />
      </section>

      {/* Analytics chart and details */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        <div className="xl:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-start justify-between mb-6 gap-4">
            <div>
              <h4 className="text-base sm:text-lg font-bold">Revenue Timeline</h4>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fleet remittance performance over the selected period
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="size-3 rounded-full bg-brand" />
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Naira (₦)
              </span>
            </div>
          </div>
          <div className="h-64 -ml-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenue30d} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="muvaOwnerRev" x1="0" y1="0" x2="0" y2="1">
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
                    formatter={(v: number) => [naira(v), "Remitted"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#0F8A5F"
                    strokeWidth={2}
                    fill="url(#muvaOwnerRev)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        {/* Fleet efficiency details */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
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
                <span className="text-xs font-semibold text-muted-foreground">Distance Covered</span>
                <span className="text-sm font-mono font-bold">{kpis.totalDistance.toLocaleString()} KM</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-xs font-semibold text-muted-foreground">Vehicles Under Repair</span>
                <span className="text-sm font-mono font-bold text-amber-600">{kpis.maintenanceCount} Units</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-brand-soft/45 border border-brand/15 rounded-lg text-xs mt-4 text-brand-dark">
            <p className="font-bold text-brand flex items-center gap-1">Workspace Notice</p>
            <p className="text-foreground/70 mt-1 leading-relaxed">
              Workspace data is fully isolated to this tenant. No driver logs or payments leak to other company dashboards.
            </p>
          </div>
        </div>
      </section>

      {/* Fleet table & Maintenance logs */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Vehicles Registry with HP progression */}
        <div className="xl:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base">Fleet & Hire Purchase Status</h3>
            <Link href="/vehicles" className="text-xs text-brand hover:underline font-semibold flex items-center gap-1">
              View Fleet Registry <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                  <th className="px-4 py-2">Vehicle ID</th>
                  <th className="px-4 py-2">Assigned Driver</th>
                  <th className="px-4 py-2">Fuel Type</th>
                  <th className="px-4 py-2">HP Progress</th>
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
                    <td className="px-4 py-3">
                      {v.contractProgress !== null ? (
                        <div className="max-w-[120px] w-full">
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-brand h-full rounded-full" style={{ width: `${v.contractProgress}%` }} />
                          </div>
                          <span className="text-[9px] text-muted-foreground mt-1 block font-mono font-semibold">{v.contractProgress}% paid</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground font-medium">No Contract</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-brand">
                      {naira(v.totalRevenue || 0)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                          v.status === "AVAILABLE"
                            ? "bg-brand/10 text-brand"
                            : v.status === "ON_ROAD"
                            ? "bg-brand-soft text-brand-dark"
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

        {/* Maintenance Logs */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base flex items-center gap-1.5">
                <Wrench className="size-4 text-brand" /> Maintenance Logs
              </h3>
              <Link href="/maintenance" className="text-xs text-brand hover:underline font-semibold flex items-center gap-0.5">
                Manage <ArrowRight className="size-3" />
              </Link>
            </div>
            <div className="space-y-4">
              {maintenances.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No recent repair history.</p>
              ) : (
                maintenances.map((m) => (
                  <div key={m.id} className="flex items-start gap-3 text-xs border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="size-8 rounded-full bg-amber-50 text-amber-600 grid place-items-center shrink-0 border border-amber-100">
                      <Wrench className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-foreground truncate block">
                          {m.type.replace("_", " ")}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                          {new Date(m.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5 truncate">
                        Vehicle: <span className="font-semibold text-foreground font-mono">{m.vehicleId.toUpperCase()}</span> • {m.workshop}
                      </p>
                      <p className="font-semibold text-amber-600 mt-0.5">
                        Cost: {naira(m.cost)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Recent Fleet Activity Remittance logs */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">
          <Activity className="size-4.5 text-brand" /> Recent Remittance Receipts
        </h3>
        <div className="space-y-4">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">No recent shift activity recorded.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentActivity.map((act) => (
                <div key={act.id} className="border border-border rounded-lg p-4 bg-surface/30">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold text-sm text-foreground truncate max-w-[150px]">
                      {act.driverName}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(act.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicle:</span>
                      <span className="font-semibold text-brand">{act.vehicleId.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remitted:</span>
                      <span className="font-bold text-brand">{naira(act.revenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shortfall:</span>
                      <span className={cn("font-bold", act.outstandingBalance > 0 ? "text-amber-600" : "text-slate-500")}>
                        {naira(act.outstandingBalance)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
