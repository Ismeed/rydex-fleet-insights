"use client";

import {
  Bar,
  BarChart,
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

interface RevenueClientProps {
  user: { name: string; role: string };
  kpis: {
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
    avgRevenuePerHour: number;
  };
  revenuePerVehicle: Array<{ vehicle: string; revenue: number }>;
  flaggedShifts: any[];
  period: string;
}

export function RevenueClient({
  user,
  kpis,
  revenuePerVehicle,
  flaggedShifts,
  period,
}: RevenueClientProps) {
  return (
    <AppShell
      title="Revenue Analytics"
      description="Daily, weekly, and monthly fleet performance analytics"
      user={user}
    >
      <FilterBar />

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          label={
            period === "daily"
              ? "Today"
              : period === "yesterday"
              ? "Yesterday"
              : period === "weekly"
              ? "This Week"
              : period === "monthly"
              ? "This Month"
              : period === "quarterly"
              ? "This Quarter"
              : period === "yearly"
              ? "This Year"
              : "Selected Period"
          }
          value={compactNaira(kpis.todayRevenue)}
          delta={{ value: 12 }}
        />
        <KpiCard label="This Week" value={compactNaira(kpis.weeklyRevenue)} delta={{ value: 8 }} delayMs={60} />
        <KpiCard label="This Month" value={compactNaira(kpis.monthlyRevenue)} delta={{ value: 15 }} delayMs={120} />
        <KpiCard label="Avg / Hour" value={compactNaira(kpis.avgRevenuePerHour)} hint="Fleet average" delayMs={180} />
      </section>

      {/* Bar Chart of Revenue per Vehicle */}
      <section
        className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm animate-fade-up"
        style={{ animationDelay: "240ms" }}
      >
        <h3 className="font-bold mb-1 text-base">Revenue by Vehicle</h3>
        <p className="text-xs text-muted-foreground mb-5">Totals across the active fleet for the selected period</p>
        <div className="h-72">
          {revenuePerVehicle.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenuePerVehicle}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis
                  dataKey="vehicle"
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#64748B" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `₦${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(v: number) => [naira(v), "Revenue"]}
                  contentStyle={{
                    border: "1px solid #E2E8F0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="revenue" fill="#0F8A5F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              No vehicle revenue logged today
            </div>
          )}
        </div>
      </section>

      {/* Anomaly Detection Section */}
      <section
        className="bg-white border border-danger/20 rounded-xl p-5 sm:p-6 shadow-sm animate-fade-up"
        style={{ animationDelay: "320ms" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="size-2.5 bg-danger rounded-full animate-pulse" />
          <h3 className="font-bold text-base text-danger">Anomaly Performance Detection</h3>
        </div>
        
        <div className="space-y-4">
          {flaggedShifts.length > 0 ? (
            flaggedShifts.map((s) => (
              <div
                key={s.id}
                className="p-4 bg-danger-soft/40 rounded-lg border border-danger/10 text-xs sm:text-sm"
              >
                <p className="font-bold text-danger">
                  Underperformance flagged: {s.vehicleId.toUpperCase()}
                </p>
                <p className="text-foreground/70 mt-1">
                  Driver {s.driver?.name} reported {naira(s.revenue)} today for a duration of {s.hoursWorked} hours (Avg: {naira(s.revenuePerHour)}/hr).
                  This falls below the expected fleet thresholds. Review shift logs and closing odometer readings.
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 bg-brand-soft/40 rounded-lg border border-brand/10 text-xs sm:text-sm text-brand-dark">
              <p className="font-bold text-brand">All Shifts normal</p>
              <p className="text-foreground/70 mt-1">
                No underperformance anomalies flagged today. The driver revenues align with duration worked.
              </p>
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
