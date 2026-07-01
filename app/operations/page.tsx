import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { OperationsClient } from "@/components/operations-client";

export const dynamic = "force-dynamic";

export default async function OperationsManagerDashboardPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "OPERATIONS_MANAGER") {
    redirect("/login");
  }

  const companyId = user.companyId;
  if (!companyId) {
    redirect("/login");
  }

  // Load the company info
  const company = await dbService.getCompanyById(companyId);
  const companyName = company ? company.name : "MUVA Operations Workspace";

  // Load operational datasets
  const vehicles = await dbService.getVehicles(companyId);
  const drivers = await dbService.getDrivers(companyId);
  const shifts = await dbService.getShiftsHistory(companyId);
  const activeShifts = await dbService.getActiveShifts(companyId);

  return (
    <OperationsClient
      user={user}
      vehicles={vehicles}
      drivers={drivers}
      shifts={shifts}
      activeShifts={activeShifts}
      companyName={companyName}
    />
  );
}
