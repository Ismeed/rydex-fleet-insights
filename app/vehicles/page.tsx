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
    user.role !== "COMPANY_OWNER" &&
    user.role !== "OPERATIONS_MANAGER"
  ) {
    redirect("/");
  }

  // Multi-tenant company context load
  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const companyId = user.companyId;

  // Load the company info
  const company = companyId ? await dbService.getCompanyById(companyId) : null;
  const companyName = company ? company.name : "MUVA Fleet Workspace";

  const vehicles = isSuperAdmin
    ? await dbService.getVehicles()
    : await dbService.getVehicles(companyId || "");

  const drivers = isSuperAdmin
    ? await dbService.getDrivers()
    : await dbService.getDrivers(companyId || "");

  // Adapt database format to registry component types
  const formattedVehicles = vehicles.map((v) => ({
    id: v.id,
    vehicleNumber: v.vehicleNumber,
    vehicleType: v.vehicleType,
    fuelType: v.fuelType,
    plateNumber: v.plateNumber,
    status: v.status,
    assignedDriverId: v.assignedDriverId,
    ownerId: v.companyId, // map ownerId to companyId for registry compatibility
    assignedDriver: v.assignedDriver ? {
      id: v.assignedDriver.id,
      name: v.assignedDriver.name,
      phone: v.assignedDriver.phone,
      status: v.assignedDriver.status
    } : null,
    owner: company ? {
      id: company.id,
      name: company.name,
      phone: company.phone,
      role: "COMPANY_OWNER"
    } : null
  }));

  const formattedDrivers = drivers.map((d) => ({
    id: d.id,
    name: d.name,
    phone: d.phone,
    status: d.status
  }));

  // Dummy owner representing the tenant company for form registry compatibility
  const formattedOwners = company ? [{
    id: company.id,
    name: company.name,
    phone: company.phone,
    role: "COMPANY_OWNER"
  }] : [];

  return (
    <AppShell title="Vehicles Fleet Registry" description={`${vehicles.length} active vehicles inside ${companyName}`} user={user} companyName={companyName}>
      <VehiclesRegistry 
        initialVehicles={formattedVehicles}
        drivers={formattedDrivers}
        owners={formattedOwners}
        currentUser={user}
      />
    </AppShell>
  );
}
