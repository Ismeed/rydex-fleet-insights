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
  }>;
}

export default async function ShiftsPage({ searchParams }: ShiftsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "OPERATIONS_OFFICER") {
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

  const activeShifts = await dbService.getActiveShifts();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const allShifts = await dbService.getShiftsHistory();

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
    />
  );
}
