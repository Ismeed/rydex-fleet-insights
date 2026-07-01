import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { ShiftsClient } from "@/components/shifts-client";
import { filterByDateRange, getPeriodDateRange, PeriodType } from "@/lib/date-filters";

export const dynamic = "force-dynamic";

interface ShiftsPageProps {
  searchParams?: Promise<{
    period?: string;
    start?: string;
    end?: string;
  }> | any;
}

export default async function ShiftsPage({ searchParams }: ShiftsPageProps) {
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

  const activeShifts = isSuperAdmin
    ? await dbService.getActiveShifts()
    : await dbService.getActiveShifts(companyId || "");

  const vehicles = isSuperAdmin
    ? await dbService.getVehicles()
    : await dbService.getVehicles(companyId || "");

  const drivers = isSuperAdmin
    ? await dbService.getDrivers()
    : await dbService.getDrivers(companyId || "");

  const allShifts = isSuperAdmin
    ? await dbService.getShiftsHistory()
    : await dbService.getShiftsHistory(companyId || "");

  // Completed shifts are those with an endTime.
  const completedShifts = allShifts.filter((s) => s.endTime !== null);
  const filteredCompleted = filterByDateRange(completedShifts, (s) => s.startTime, period, startStr, endStr);

  return (
    <ShiftsClient
      user={user}
      activeShifts={activeShifts}
      vehicles={vehicles}
      drivers={drivers}
      completedShifts={filteredCompleted}
      period={period}
      companyName={companyName}
    />
  );
}
