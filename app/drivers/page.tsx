import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { DriversRegistry } from "@/components/drivers-registry";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const drivers = await dbService.getDrivers();

  // Format DB drivers to match DriversRegistry interface
  const formattedDrivers = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    address: d.address || "",
    guarantorName: d.guarantorName || "",
    guarantorPhone: d.guarantorPhone || "",
    status: d.status,
    avgPerDay: d.avgPerDay || 8500,
    avgPerHour: d.avgPerHour || 1000,
    assignedVehicle: d.assignedVehicle ? {
      id: d.assignedVehicle.id,
      plateNumber: d.assignedVehicle.plateNumber
    } : null
  }));

  return (
    <AppShell title="Drivers" description={`${drivers.length} drivers on roster`} user={user}>
      <DriversRegistry initialDrivers={formattedDrivers} />
    </AppShell>
  );
}
