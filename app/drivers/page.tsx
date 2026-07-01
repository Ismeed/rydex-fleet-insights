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

  if (
    user.role !== "SUPER_ADMIN" &&
    user.role !== "COMPANY_OWNER" &&
    user.role !== "OPERATIONS_MANAGER"
  ) {
    redirect("/");
  }

  const isSuperAdmin = user.role === "SUPER_ADMIN";
  const companyId = user.companyId;

  // Load company details
  const company = companyId ? await dbService.getCompanyById(companyId) : null;
  const companyName = company ? company.name : "MUVA Fleet Workspace";

  const drivers = isSuperAdmin
    ? await dbService.getDrivers()
    : await dbService.getDrivers(companyId || "");

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
    <AppShell title="Drivers Registry" description={`${drivers.length} drivers on roster inside ${companyName}`} user={user} companyName={companyName}>
      <DriversRegistry initialDrivers={formattedDrivers} />
    </AppShell>
  );
}
