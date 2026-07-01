import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { ReportsClient } from "@/components/reports-client";
import { filterByDateRange, getPeriodDateRange, PeriodType } from "@/lib/date-filters";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams?: Promise<{
    period?: string;
    start?: string;
    end?: string;
  }> | any;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
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

  // Defensive searchParams Promise resolution
  let resolvedParams: any = {};
  try {
    if (searchParams) {
      resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;
    }
  } catch (e) {
    resolvedParams = {};
  }
  const period = ((resolvedParams && resolvedParams.period) || "monthly") as PeriodType;
  const startStr = resolvedParams && resolvedParams.start;
  const endStr = resolvedParams && resolvedParams.end;

  const { start, end } = getPeriodDateRange(period, startStr, endStr);

  const shifts = isSuperAdmin
    ? await dbService.getShiftsHistory()
    : await dbService.getShiftsHistory(companyId || "");

  const vehicles = isSuperAdmin
    ? await dbService.getVehicles()
    : await dbService.getVehicles(companyId || "");
  
  const drivers = isSuperAdmin
    ? await dbService.getDrivers()
    : await dbService.getDrivers(companyId || "");

  const contracts = isSuperAdmin
    ? await dbService.getHirePurchaseContracts()
    : await dbService.getHirePurchaseContracts(companyId || "");

  const maintenances = isSuperAdmin
    ? await dbService.getMaintenanceJobs()
    : await dbService.getMaintenanceJobs(companyId || "");

  // Filter based on period
  const filteredShifts = filterByDateRange(shifts, (s) => s.startTime, period, startStr, endStr);
  const filteredMaintenances = filterByDateRange(maintenances, (m) => m.date, period, startStr, endStr);

  return (
    <ReportsClient
      user={user}
      shifts={filteredShifts}
      vehicles={vehicles}
      drivers={drivers}
      contracts={contracts}
      maintenances={filteredMaintenances}
      period={period}
      startDateStr={startStr}
      endDateStr={endStr}
      companyName={companyName}
    />
  );
}
