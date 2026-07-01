import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { ContractsClient } from "@/components/contracts-client";

export const dynamic = "force-dynamic";

export default async function HirePurchaseContractsPage() {
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

  // Load contracts, vehicles, and drivers
  const contracts = await dbService.getHirePurchaseContracts(companyId);
  const vehicles = await dbService.getVehicles(companyId);
  const drivers = await dbService.getDrivers(companyId);

  return (
    <ContractsClient
      user={user}
      contracts={contracts}
      vehicles={vehicles}
      drivers={drivers}
      companyName={companyName}
    />
  );
}
