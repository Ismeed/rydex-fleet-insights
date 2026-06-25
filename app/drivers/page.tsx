import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { compactNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const drivers = await dbService.getDrivers();

  return (
    <AppShell title="Drivers" description={`${drivers.length} drivers on roster`} user={user}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-up">
        {drivers.map((d) => (
          <div key={d.id} className="bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-full bg-brand/10 text-brand grid place-items-center font-bold text-sm shrink-0">
                    {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/drivers/${d.id}`} className="font-semibold truncate hover:text-brand hover:underline block">
                      {d.name}
                    </Link>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">{d.phone}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "px-2 py-1 text-[10px] font-bold rounded uppercase shrink-0 tracking-wider",
                    d.status === "active" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                  )}
                >
                  {d.status}
                </span>
              </div>

              <div className="text-xs space-y-1.5 text-muted-foreground my-3 border-t border-border pt-3">
                <p><span className="font-bold text-foreground">Guarantor:</span> {d.guarantorName}</p>
                <p className="font-mono"><span className="font-bold text-foreground font-sans">G-Phone:</span> {d.guarantorPhone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border mt-2">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle</p>
                {d.assignedVehicle ? (
                  <Link href={`/vehicles/${d.assignedVehicle.id}`} className="text-sm font-mono mt-0.5 text-brand hover:underline font-semibold block">
                    {d.assignedVehicle.id.toUpperCase()}
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground mt-0.5">—</p>
                )}
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Avg / Day</p>
                <p className="text-sm font-mono font-bold mt-0.5 text-foreground">{compactNaira(d.avgPerDay)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
