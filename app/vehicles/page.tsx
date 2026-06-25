import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-brand/10 text-brand",
  MAINTENANCE: "bg-warn-soft text-warn",
  OFFLINE: "bg-muted text-muted-foreground",
};

export default async function VehiclesPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const vehicles = await dbService.getVehicles();

  return (
    <AppShell title="Vehicle Registry" description={`${vehicles.length} vehicles across CityView Katsina`} user={user}>
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Vehicle ID</th>
                <th className="px-6 py-3 hidden sm:table-cell">Plate Number</th>
                <th className="px-6 py-3 hidden md:table-cell">Type</th>
                <th className="px-6 py-3 hidden md:table-cell">Fuel</th>
                <th className="px-6 py-3">Assigned Driver</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-brand">
                    <Link href={`/vehicles/${v.id}`} className="hover:underline">
                      {v.id.toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell font-mono text-muted-foreground">{v.plateNumber}</td>
                  <td className="px-6 py-4 hidden md:table-cell">{v.vehicleType}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-brand/5 text-brand text-[10px] font-bold rounded">{v.fuelType}</span>
                  </td>
                  <td className="px-6 py-4">
                    {v.assignedDriver ? (
                      <Link href={`/drivers/${v.assignedDriver.id}`} className="hover:underline font-medium">
                        {v.assignedDriver.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn("px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider", STATUS_TONE[v.status])}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
