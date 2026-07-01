import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AdminCompaniesClient } from "@/components/admin-companies-client";

export const dynamic = "force-dynamic";

export default async function AdminCompaniesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  const companies = await dbService.getCompanies();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const users = await dbService.getUsers();

  return (
    <AdminCompaniesClient
      user={user}
      companies={companies}
      vehicles={vehicles}
      drivers={drivers}
      users={users}
    />
  );
}
