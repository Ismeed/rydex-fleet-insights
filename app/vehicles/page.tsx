import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { VehiclesRegistry } from "@/components/vehicles-registry";

export const dynamic = "force-dynamic";

export default async function VehiclesPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (
    user.role !== "SUPER_ADMIN" &&
    user.role !== "VEHICLE_OWNER" &&
    user.role !== "OPERATIONS_OFFICER"
  ) {
    redirect("/");
  }

  const vehicles = user.role === "VEHICLE_OWNER"
    ? await dbService.getVehicles(user.id)
    : await dbService.getVehicles();

  const rawDrivers = await dbService.getDrivers();
  const drivers = user.role === "VEHICLE_OWNER"
    ? rawDrivers.filter((d) => d.assignedVehicle?.ownerId === user.id)
    : rawDrivers;

  const allUsers = await dbService.getUsers();
  
  // Filter for users who can own vehicles
  const owners = allUsers.filter((u) => {
    if (user.role === "VEHICLE_OWNER") {
      return u.id === user.id;
    }
    return u.role === "VEHICLE_OWNER" || u.role === "SUPER_ADMIN";
  });

  // Adapt the returned db format to the registry type
  const formattedVehicles = vehicles.map((v) => ({
    id: v.id,
    vehicleNumber: v.vehicleNumber,
    vehicleType: v.vehicleType,
    fuelType: v.fuelType,
    plateNumber: v.plateNumber,
    status: v.status,
    assignedDriverId: v.assignedDriverId,
    ownerId: v.ownerId,
    assignedDriver: v.assignedDriver ? {
      id: v.assignedDriver.id,
      name: v.assignedDriver.name,
      phone: v.assignedDriver.phone,
      status: v.assignedDriver.status
    } : null,
    owner: v.owner ? {
      id: v.owner.id,
      name: v.owner.name,
      phone: v.owner.phone,
      role: v.owner.role
    } : null
  }));

  const formattedDrivers = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    status: d.status
  }));

  const formattedOwners = owners.map((o) => ({
    id: o.id,
    name: o.name,
    phone: o.phone,
    role: o.role
  }));

  return (
    <AppShell title="Vehicle Registry" description={`${vehicles.length} vehicles across CityView Katsina`} user={user}>
      <VehiclesRegistry 
        initialVehicles={formattedVehicles}
        drivers={formattedDrivers}
        owners={formattedOwners}
        currentUser={user}
      />
    </AppShell>
  );
}
