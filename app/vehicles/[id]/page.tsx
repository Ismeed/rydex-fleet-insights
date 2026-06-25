import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { naira, compactNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function VehicleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const vehicle = await dbService.getVehicleById(id);
  if (!vehicle) {
    notFound();
  }

  // Calculate statistics
  const shiftsCount = vehicle.shifts?.length || 0;
  const totalRevenue = vehicle.shifts?.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0) || 0;
  const totalKm = vehicle.shifts?.reduce((sum: number, s: any) => sum + (s.distanceCovered || 0), 0) || 0;
  const totalHours = vehicle.shifts?.reduce((sum: number, s: any) => sum + (s.hoursWorked || 0) + (s.minutesWorked || 0) / 60, 0) || 0;
  
  const avgRevPerShift = shiftsCount > 0 ? Math.round(totalRevenue / shiftsCount) : 0;
  const avgRevPerHour = totalHours > 0 ? Math.round(totalRevenue / totalHours) : 0;

  return (
    <AppShell
      title={`Vehicle ${vehicle.id.toUpperCase()}`}
      description={`Plate: ${vehicle.plateNumber} • ${vehicle.vehicleType} • ${vehicle.fuelType}`}
      user={user}
    >
      <Link href="/vehicles" className="text-xs text-brand font-semibold hover:underline">
        &larr; Back to Registry
      </Link>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
        {/* Core Stats */}
        <div className="md:col-span-2 bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-base border-b border-border pb-3">Operational Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Revenue</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-brand">{compactNaira(totalRevenue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Distance</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">{totalKm.toFixed(1)} KM</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Shifts</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">{shiftsCount}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg / Shift</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">{compactNaira(avgRevPerShift)}</p>
            </div>
          </div>
        </div>

        {/* Assigned Driver Card */}
        <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base border-b border-border pb-3">Assigned Driver</h3>
            {vehicle.assignedDriver ? (
              <div className="mt-4 flex items-center gap-3">
                <div className="size-11 rounded-full bg-brand/10 text-brand grid place-items-center font-bold text-base shrink-0">
                  {vehicle.assignedDriver.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <Link href={`/drivers/${vehicle.assignedDriver.id}`} className="font-bold text-sm hover:underline block truncate text-brand">
                    {vehicle.assignedDriver.name}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{vehicle.assignedDriver.phone}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mt-4">No driver assigned to this vehicle.</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <span className={cn("px-2 py-0.5 font-bold rounded uppercase tracking-wider text-[10px]",
              vehicle.status === "ACTIVE" ? "bg-brand/10 text-brand" : "bg-warn-soft text-warn"
            )}>
              {vehicle.status}
            </span>
          </div>
        </div>
      </section>

      {/* Shifts History Table */}
      <section className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-base">Shift History</h3>
          <p className="text-xs text-muted-foreground">Details of all shifts operated by this vehicle</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Odometer (Start / End)</th>
                <th className="px-6 py-3 hidden sm:table-cell">Duration</th>
                <th className="px-6 py-3 hidden sm:table-cell">Distance</th>
                <th className="px-6 py-3 text-right">Revenue</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {vehicle.shifts && vehicle.shifts.length > 0 ? (
                vehicle.shifts.map((s: any) => (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-foreground">
                        {new Date(s.startTime).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(s.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        {s.endTime && ` - ${new Date(s.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {s.startOdometer} KM / {s.endOdometer ? `${s.endOdometer} KM` : "—"}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell font-mono">
                      {s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "Active"}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell font-mono">
                      {s.distanceCovered !== null ? `${s.distanceCovered} KM` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold">
                      {s.revenue !== null ? naira(s.revenue) : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider",
                        s.status === "ACTIVE" ? "bg-brand/10 text-brand" : s.status === "ENDED" ? "bg-muted text-muted-foreground" : "bg-danger-soft text-danger"
                      )}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-6 text-center text-xs text-muted-foreground">
                    No shifts logged for this vehicle.
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
