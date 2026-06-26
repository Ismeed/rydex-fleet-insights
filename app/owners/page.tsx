import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { OwnersRegistry } from "@/components/owners-registry";

export const dynamic = "force-dynamic";

export default async function OwnersPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // Fetch all users to find owners
  const allUsers = await dbService.getUsers();
  const owners = allUsers.filter((u) => u.role === "VEHICLE_OWNER");

  // Format each owner with their dynamically aggregated fleet data
  const formattedOwners = await Promise.all(
    owners.map(async (owner) => {
      const vehicles = await dbService.getVehicles(owner.id);
      const shifts = await dbService.getShiftsHistory(owner.id);

      // Map vehicles to include their specific aggregates
      const ownerVehiclesFormatted = vehicles.map((v) => {
        const vShifts = shifts.filter((s) => s.vehicleId === v.id);
        const distance = vShifts.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
        const revenue = vShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

        return {
          id: v.id,
          vehicleNumber: v.vehicleNumber,
          plateNumber: v.plateNumber,
          status: v.status,
          totalRevenue: revenue,
          totalDistance: distance,
        };
      });

      // Total aggregated revenue across the entire fleet
      const totalRevenue = shifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

      return {
        id: owner.id,
        name: owner.name,
        phone: owner.phone,
        email: owner.email || null,
        status: owner.status || "active",
        vehiclesCount: vehicles.length,
        totalRevenue,
        vehicles: ownerVehiclesFormatted,
      };
    })
  );

  return (
    <AppShell 
      title="Owner & Investor Management" 
      description={`${formattedOwners.length} registered fleet partners`} 
      user={user}
    >
      <OwnersRegistry initialOwners={formattedOwners} />
    </AppShell>
  );
}
