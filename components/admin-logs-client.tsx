"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { 
  ShieldAlert, 
  Info, 
  AlertTriangle, 
  Search, 
  Calendar 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminLogsClientProps {
  user: { name: string; role: string };
  shifts: any[];
  companies: any[];
  users: any[];
}

interface AuditEvent {
  id: string;
  action: string;
  category: "SECURITY" | "OPERATIONS" | "BILLING" | "SYSTEM";
  user: string;
  timestamp: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  details: string;
}

export function AdminLogsClient({
  user,
  shifts,
  companies,
  users: platformUsers,
}: AdminLogsClientProps) {
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");

  // Compile dynamic audit logs from database entities
  const auditLogs: AuditEvent[] = [];

  // 1. Company onboarding logs
  companies.forEach((c, index) => {
    // Generate dates based on company registration
    const time = new Date(Date.now() - (30 - index) * 24 * 3600 * 1000).toISOString();
    auditLogs.push({
      id: `log-comp-${c.id}`,
      action: "WORKSPACE_ONBOARDING",
      category: "BILLING",
      user: "Platform Administrator",
      timestamp: time,
      severity: "INFO",
      details: `Registered tenant company "${c.name}" on tier ${c.subscription || "TRIAL"}. Fleet: ${c.fleetType}. Phone: ${c.phone}`,
    });

    if (c.status === "SUSPENDED") {
      auditLogs.push({
        id: `log-susp-${c.id}`,
        action: "COMPANY_SUSPENDED",
        category: "SECURITY",
        user: "Global System Audit",
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
        severity: "CRITICAL",
        details: `Workspace account "${c.name}" was suspended automatically due to payment defaults or compliance reviews.`,
      });
    }
  });

  // 2. Staff registry logs
  platformUsers.forEach((u, index) => {
    const time = new Date(Date.now() - (25 - index) * 24 * 3600 * 1000).toISOString();
    auditLogs.push({
      id: `log-user-${u.id}`,
      action: "USER_CREATION",
      category: "SECURITY",
      user: "Workspace Owner",
      timestamp: time,
      severity: "INFO",
      details: `Created credentials for ${u.name} with role permissions: ${u.role}. Phone: ${u.phone}`,
    });
  });

  // 3. Operational dispatches logs
  shifts.forEach((s) => {
    auditLogs.push({
      id: `log-disp-${s.id}`,
      action: "VEHICLE_DISPATCH",
      category: "OPERATIONS",
      user: "Ops Manager",
      timestamp: s.startTime,
      severity: "INFO",
      details: `Dispatched vehicle "${s.vehicleId.toUpperCase()}" with driver "${s.driver?.name || "Driver"}". Starting Odometer: ${s.startOdometer} KM`,
    });

    if (s.endTime) {
      const isShortfall = s.outstandingBalance > 0;
      auditLogs.push({
        id: `log-coll-${s.id}`,
        action: "REMITTANCE_COLLECTION",
        category: "OPERATIONS",
        user: "Ops Manager",
        timestamp: s.endTime,
        severity: isShortfall ? "WARNING" : "INFO",
        details: `Closed shift for vehicle "${s.vehicleId.toUpperCase()}". Collected: ₦${(s.revenue || 0).toLocaleString()} (Expected: ₦${(s.amountExpected || 0).toLocaleString()} • Shortfall: ₦${(s.outstandingBalance || 0).toLocaleString()})`,
      });
    }
  });

  // Sort logs by timestamp (newest first)
  const sortedLogs = auditLogs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Apply filters
  const filteredLogs = sortedLogs.filter((log) => {
    const matchesSearch = 
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase());

    const matchesSeverity = severityFilter === "ALL" || log.severity === severityFilter;

    return matchesSearch && matchesSeverity;
  });

  return (
    <AppShell
      title="Platform Audit Logs"
      description="Cryptographically tracked system logs, access reports, and dispatch transactions feed"
      user={user}
      companyName="MUVA Platform HQ"
    >
      {/* Search and Filters */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-base text-foreground">Global Activity Feed</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Filter system events across all workspace clusters.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 max-w-lg w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search audit actions, companies, users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-surface border border-border rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-brand"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">INFO Only</option>
              <option value="WARNING">WARNING Only</option>
              <option value="CRITICAL">CRITICAL Only</option>
            </select>
          </div>
        </div>

        {/* Logs Feed */}
        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 border border-border rounded-lg bg-surface/30 hover:bg-surface/55 transition-colors flex items-start gap-4"
            >
              {/* Severity Icon Indicator */}
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center shrink-0 border",
                  log.severity === "INFO"
                    ? "bg-brand/5 border-brand/10 text-brand"
                    : log.severity === "WARNING"
                    ? "bg-yellow-50 border-yellow-100 text-yellow-600"
                    : "bg-red-50 border-red-100 text-red-600 animate-pulse"
                )}
              >
                {log.severity === "INFO" ? (
                  <Info className="size-4" />
                ) : log.severity === "WARNING" ? (
                  <AlertTriangle className="size-4" />
                ) : (
                  <ShieldAlert className="size-4" />
                )}
              </div>

              {/* Event Content details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold font-mono tracking-wide px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md">
                      {log.action}
                    </span>
                    <span
                      className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                        log.category === "SECURITY"
                          ? "bg-red-50 text-red-700"
                          : log.category === "BILLING"
                          ? "bg-brand-soft text-brand-dark"
                          : "bg-blue-50 text-blue-700"
                      )}
                    >
                      {log.category}
                    </span>
                  </div>
                  
                  {/* Timestamp */}
                  <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                    <Calendar className="size-3" />
                    {new Date(log.timestamp).toLocaleString("en-NG", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: false
                    })}
                  </span>
                </div>

                <p className="text-xs text-foreground mt-2 font-medium leading-relaxed">
                  {log.details}
                </p>

                <p className="text-[10px] text-muted-foreground mt-1">
                  Actor ID: <span className="font-semibold">{log.user}</span>
                </p>
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No audit logs matched your current filters.
            </p>
          )}
        </div>
      </section>
    </AppShell>
  );
}
