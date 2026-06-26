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
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "PASSENGER") {
    redirect("/");
  }

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

  const shifts = user.role === "VEHICLE_OWNER"
    ? await dbService.getShiftsHistory(user.id)
    : await dbService.getShiftsHistory();
  const vehicles = user.role === "VEHICLE_OWNER"
    ? await dbService.getVehicles(user.id)
    : await dbService.getVehicles();
  
  const rawDrivers = await dbService.getDrivers();
  const drivers = user.role === "VEHICLE_OWNER"
    ? rawDrivers.filter((d) => d.assignedVehicle?.ownerId === user.id)
    : rawDrivers;

  const redemptions = user.role === "SUPER_ADMIN"
    ? await dbService.getRedemptions()
    : [];

  // Filter based on period
  const filteredShifts = filterByDateRange(shifts, (s) => s.startTime, period, startStr, endStr);
  const filteredRedemptions = filterByDateRange(redemptions, (r) => r.requestedAt, period, startStr, endStr);

  return (
    <ReportsClient
      user={user}
      shifts={filteredShifts}
      vehicles={vehicles}
      drivers={drivers}
      redemptions={filteredRedemptions}
      period={period}
      startDateStr={startStr}
      endDateStr={endStr}
    />
  );
}
