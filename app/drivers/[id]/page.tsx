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

export default async function DriverDetailPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const driver = await dbService.getDriverById(id);
  if (!driver) {
    notFound();
  }

  // Calculate statistics
  const shiftsCount = driver.shifts?.length || 0;
  const totalRevenue = driver.shifts?.reduce((sum: number, s: any) => sum + (s.revenue || 0), 0) || 0;
  const totalHours = driver.shifts?.reduce((sum: number, s: any) => sum + (s.hoursWorked || 0) + (s.minutesWorked || 0) / 60, 0) || 0;
  
  const avgRevPerDay = shiftsCount > 0 ? Math.round(totalRevenue / shiftsCount) : driver.avgPerDay;
  const avgRevPerHour = totalHours > 0 ? Math.round(totalRevenue / totalHours) : driver.avgPerHour;

  return (
    <AppShell
      title={`Driver: ${driver.name}`}
      description={`Contact: ${driver.phone} • Status: ${driver.status.toUpperCase()}`}
      user={user}
    >
      <Link href="/drivers" className="text-xs text-brand font-semibold hover:underline">
        &larr; Back to Drivers
      </Link>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-up">
        {/* Core Stats */}
        <div className="md:col-span-2 bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-6">
          <h3 className="font-bold text-base border-b border-border pb-3">Performance Overview</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Earned</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-brand">{compactNaira(totalRevenue)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average / Day</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">{compactNaira(avgRevPerDay)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average / Hour</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">{compactNaira(avgRevPerHour)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Shifts Worked</p>
              <p className="text-xl sm:text-2xl font-extrabold font-mono text-foreground">{shiftsCount}</p>
            </div>
          </div>
        </div>

        {/* Guarantor Details */}
        <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base border-b border-border pb-3">Guarantor Information</h3>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Guarantor Name</p>
                <p className="text-sm font-semibold mt-0.5 text-foreground">{driver.guarantorName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Guarantor Phone</p>
                <p className="text-sm font-mono mt-0.5 text-foreground">{driver.guarantorPhone}</p>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Assigned Vehicle</span>
            {driver.assignedVehicle ? (
              <Link href={`/vehicles/${driver.assignedVehicle.id}`} className="font-mono font-bold text-brand hover:underline">
                {driver.assignedVehicle.id.toUpperCase()}
              </Link>
            ) : (
              <span className="text-muted-foreground">None</span>
            )}
          </div>
        </div>
      </section>

      {/* Driver Shifts History */}
      <section className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up" style={{ animationDelay: "120ms" }}>
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-base">Driver Shift logs</h3>
          <p className="text-xs text-muted-foreground">Shift logs for revenue verification</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Vehicle</th>
                <th className="px-6 py-3">Odometer Reading</th>
                <th className="px-6 py-3 hidden sm:table-cell">Duration</th>
                <th className="px-6 py-3 text-right">Revenue Submitted</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {driver.shifts && driver.shifts.length > 0 ? (
                driver.shifts.map((s: any) => (
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
                    <td className="px-6 py-4 font-mono font-semibold text-brand">
                      <Link href={`/vehicles/${s.vehicleId}`} className="hover:underline">
                        {s.vehicleId.toUpperCase()}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {s.startOdometer} KM / {s.endOdometer ? `${s.endOdometer} KM` : "—"}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell font-mono">
                      {s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "Active"}
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
                    No shifts logged for this driver.
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
