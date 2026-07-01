import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AdminClient } from "@/components/admin-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  // Load SaaS-wide datasets
  const companies = await dbService.getCompanies();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const users = await dbService.getUsers();

  return (
    <AdminClient
      user={user}
      companies={companies}
      vehicles={vehicles}
      drivers={drivers}
      users={users}
    />
  );
}
