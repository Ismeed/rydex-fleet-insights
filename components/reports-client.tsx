"use client";

import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { generateReportPDF } from "@/lib/pdf-generator";
import { Download, FileText, Users, Car, Gift, Printer } from "lucide-react";
import { toast } from "sonner";

interface ReportsClientProps {
  user: { name: string; role: string };
  shifts: any[];
  vehicles: any[];
  drivers: any[];
  redemptions: any[];
  period: string;
  startDateStr?: string;
  endDateStr?: string;
}

export function ReportsClient({
  user,
  shifts,
  vehicles,
  drivers,
  redemptions,
  period,
  startDateStr,
  endDateStr,
}: ReportsClientProps) {
  
  const getPeriodText = () => {
    if (period === "custom") {
      return `Custom Range (${startDateStr || "—"} to ${endDateStr || "—"})`;
    }
    const periodLabels: Record<string, string> = {
      daily: "Today",
      yesterday: "Yesterday",
      weekly: "This Week",
      monthly: "This Month",
      quarterly: "This Quarter",
      yearly: "This Year",
    };
    return periodLabels[period] || "Monthly";
  };

  // Client-side CSV generator utility
  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    try {
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(`${filename} exported successfully!`);
    } catch (e) {
      toast.error("Failed to export report");
    }
  };

  const exportDailyOps = (format: string) => {
    if (format === "PDF") {
      try {
        generateReportPDF("daily-ops", shifts, getPeriodText(), "muva_daily_ops_report.pdf");
        toast.success("Daily Operations PDF generated successfully!");
      } catch (e) {
        toast.error("Failed to generate PDF report");
      }
      return;
    }
    const headers = [
      "Shift ID",
      "Vehicle",
      "Driver",
      "Start Time",
      "End Time",
      "Start Odo (KM)",
      "End Odo (KM)",
      "Distance (KM)",
      "Revenue (NGN)",
      "Hours",
      "Status",
    ];
    const rows = shifts.map((s) => [
      s.id,
      s.vehicleId,
      s.driver?.name || "Driver",
      s.startTime,
      s.endTime || "Active",
      s.startOdometer,
      s.endOdometer || "—",
      s.distanceCovered || "—",
      s.revenue || "0",
      s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "Active",
      s.status,
    ]);
    downloadCSV("muva_daily_ops_report.csv", headers, rows);
  };

  const exportVehicles = (format: string) => {
    if (format === "PDF") {
      try {
        generateReportPDF("vehicles", vehicles, getPeriodText(), "muva_vehicles_report.pdf");
        toast.success("Vehicle Performance PDF generated successfully!");
      } catch (e) {
        toast.error("Failed to generate PDF report");
      }
      return;
    }
    const headers = ["Vehicle ID", "Plate Number", "Type", "Fuel Type", "Assigned Driver", "Status"];
    const rows = vehicles.map((v) => [
      v.id,
      v.plateNumber,
      v.vehicleType,
      v.fuelType,
      v.assignedDriver?.name || "None",
      v.status,
    ]);
    downloadCSV("muva_vehicles_report.csv", headers, rows);
  };

  const exportDrivers = (format: string) => {
    if (format === "PDF") {
      try {
        generateReportPDF("drivers", drivers, getPeriodText(), "muva_drivers_report.pdf");
        toast.success("Driver Performance PDF generated successfully!");
      } catch (e) {
        toast.error("Failed to generate PDF report");
      }
      return;
    }
    const headers = [
      "Driver Name",
      "Phone",
      "Address",
      "Guarantor Name",
      "Guarantor Phone",
      "Status",
      "Avg/Day (NGN)",
    ];
    const rows = drivers.map((d) => [
      d.name,
      d.phone,
      d.address,
      d.guarantorName,
      d.guarantorPhone,
      d.status,
      d.avgPerDay,
    ]);
    downloadCSV("muva_drivers_report.csv", headers, rows);
  };

  const exportRewards = (format: string) => {
    if (format === "PDF") {
      try {
        generateReportPDF("rewards", redemptions, getPeriodText(), "muva_redemptions_report.pdf");
        toast.success("Reward Redemptions PDF generated successfully!");
      } catch (e) {
        toast.error("Failed to generate PDF report");
      }
      return;
    }
    const headers = ["Passenger", "Phone", "Reward Requested", "Points Used", "Status", "Requested At"];
    const rows = redemptions.map((r) => [
      r.passenger?.name || "Passenger",
      r.passenger?.phone || "—",
      r.rewardRequested,
      r.pointsUsed,
      r.status,
      r.requestedAt,
    ]);
    downloadCSV("muva_redemptions_report.csv", headers, rows);
  };

  const REPORTS = [
    { icon: FileText, label: "Daily Operations", desc: "Per-shift activity, revenue, distance records", action: exportDailyOps },
    { icon: Car, label: "Vehicle Performance", desc: "Plate details, fuel types, statuses, registry", action: exportVehicles },
    { icon: Users, label: "Driver Performance", desc: "Driver roster, phone contacts, guarantors, averages", action: exportDrivers },
    ...(user.role === "SUPER_ADMIN"
      ? [{ icon: Gift, label: "Reward Redemptions", desc: "Passenger loyalty code exchanges, approvals queue", action: exportRewards }]
      : []),
  ];

  return (
    <AppShell title="Reports" description="Generate downloadable reports for CityView Katsina" user={user}>
      <FilterBar />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-up">
        {REPORTS.map((r, i) => (
          <div
            key={r.label}
            className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="size-10 rounded-lg bg-brand/10 text-brand grid place-items-center shrink-0">
                <r.icon className="size-5" />
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                {["PDF / Print", "CSV / Excel"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => r.action(fmt === "PDF / Print" ? "PDF" : "CSV")}
                    className="px-2.5 py-1 border border-border rounded text-[10px] font-bold hover:bg-surface transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    {fmt === "PDF / Print" ? <Printer className="size-3" /> : <Download className="size-3" />}
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <h3 className="font-bold text-base mt-4">{r.label}</h3>
            <p className="text-xs text-muted-foreground mt-1">{r.desc}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
