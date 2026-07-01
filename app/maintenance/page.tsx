import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { MaintenanceClient } from "@/components/maintenance-client";

export const dynamic = "force-dynamic";

export default async function MaintenancePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const companyId = user.companyId;
  if (!companyId) {
    redirect("/login");
  }

  // Load company details
  const company = await dbService.getCompanyById(companyId);
  const companyName = company ? company.name : "MUVA Fleet Workspace";

  // Load maintenance jobs and vehicles
  const maintenances = await dbService.getMaintenanceJobs(companyId);
  const vehicles = await dbService.getVehicles(companyId);

  return (
    <MaintenanceClient
      user={user}
      maintenances={maintenances}
      vehicles={vehicles}
      companyName={companyName}
    />
  );
}
