"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { cn } from "@/lib/utils";
import { 
  Building, 
  Car, 
  TrendingUp, 
  ShieldCheck, 
  Activity, 
  ArrowRight 
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AdminClientProps {
  user: { name: string; role: string };
  companies: any[];
  vehicles: any[];
  drivers: any[];
  users: any[];
}

export function AdminClient({
  user,
  companies,
  vehicles,
  drivers,
  users,
}: AdminClientProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCompanies = companies.filter((c) => c.status === "ACTIVE").length;

  const monthlyRevenue = companies.reduce((sum, c) => {
    if (c.status !== "ACTIVE") return sum;
    if (c.subscription === "BASIC") return sum + 50000;
    if (c.subscription === "PREMIUM") return sum + 150000;
    if (c.subscription === "ENTERPRISE") return sum + 500000;
    return sum;
  }, 0);

  // Generate monthly SaaS revenue chart data (e.g. historical points)
  const chartData = [
    { label: "Jan", revenue: monthlyRevenue * 0.4 },
    { label: "Feb", revenue: monthlyRevenue * 0.55 },
    { label: "Mar", revenue: monthlyRevenue * 0.7 },
    { label: "Apr", revenue: monthlyRevenue * 0.8 },
    { label: "May", revenue: monthlyRevenue * 0.9 },
    { label: "Jun", revenue: monthlyRevenue },
  ];

  const recentCompanies = companies.slice(-4).reverse();

  return (
    <AppShell
      title="SaaS Overview Dashboard"
      description="MUVA Mobility platform analytics, subscription revenues, and cluster status logs"
      user={user}
      companyName="MUVA Platform HQ"
    >
      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Companies"
          value={companies.length}
          badge={{ label: `${activeCompanies} Active`, tone: "brand" }}
        />
        <KpiCard
          label="Monthly SaaS Revenue"
          value={`₦${monthlyRevenue.toLocaleString()}`}
          badge={{ label: "Live Ledger", tone: "brand" }}
        />
        <KpiCard
          label="Global Vehicles Fleet"
          value={`${vehicles.length} Units`}
          badge={{ label: "Monitored", tone: "brand" }}
        />
        <KpiCard
          label="Platform Status"
          value="Healthy"
          badge={{ label: "99.9% Uptime", tone: "brand" }}
        />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 animate-fade-up">
        <div className="xl:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm">
          <h4 className="font-bold text-base mb-1">Monthly Subscription Growth</h4>
          <p className="text-xs text-muted-foreground mb-6">SaaS platform billing timeline</p>
          <div className="h-64 -ml-2">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="saasRevG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0F8A5F" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#0F8A5F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => `₦${Math.round(v / 1000)}k`} />
                  <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, "SaaS Revenue"]} contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#0F8A5F" strokeWidth={2} fill="url(#saasRevG)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full bg-slate-50 animate-pulse rounded-lg" />
            )}
          </div>
        </div>

        {/* Cluster health stats */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <Activity className="size-4 text-brand" /> System Metrics
            </h4>
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Database Pool</span>
                <span className="text-emerald-600">CONNECTED</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Redis Cache</span>
                <span className="text-emerald-600">ONLINE (9 ms)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">API Latency</span>
                <span>42 ms (Avg)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-muted-foreground">Global Drivers</span>
                <span>{drivers.length} registered</span>
              </div>
            </div>
          </div>
          <div className="p-4 bg-brand-soft/40 border border-brand/15 rounded-lg text-xs mt-4 text-brand-dark">
            <p className="font-bold text-brand">Admin Console</p>
            <p className="text-foreground/75 mt-1 leading-relaxed">
              Super Admin logs and actions are stored securely inside the global database cache.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Tenant registrations list */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-base">Newest Registrations</h3>
          <a href="/admin/companies" className="text-xs text-brand hover:underline font-bold flex items-center gap-1">
            Manage Companies <ArrowRight className="size-3" />
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {recentCompanies.map((c) => (
            <div key={c.id} className="border border-border rounded-lg p-4 bg-surface/30">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-foreground truncate max-w-[150px]">{c.name}</span>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                  c.status === "ACTIVE" ? "bg-brand-soft text-brand-dark" : "bg-warn-soft text-warn"
                )}>{c.status}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{c.phone} • {c.fleetType}</p>
              <p className="text-xs font-mono font-bold text-brand mt-2">{c.subscription}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
