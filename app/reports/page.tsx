import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { ReportsClient } from "@/components/reports-client";
import { filterByDateRange, getPeriodDateRange, PeriodType } from "@/lib/date-filters";

export const dynamic = "force-dynamic";

interface ReportsPageProps {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const params = await searchParams;
  const period = (params.period || "monthly") as PeriodType;
  const startStr = params.start;
  const endStr = params.end;

  const { start, end } = getPeriodDateRange(period, startStr, endStr);

  const shifts = await dbService.getShiftsHistory();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const redemptions = await dbService.getRedemptions();

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
