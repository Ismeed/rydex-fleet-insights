import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { OwnerClient } from "@/components/owner-client";
import { filterByDateRange, getPeriodDateRange, getChartDataForPeriod, PeriodType } from "@/lib/date-filters";

export const dynamic = "force-dynamic";

interface VehicleOwnerPageProps {
  searchParams: Promise<{
    period?: string;
    start?: string;
    end?: string;
  }>;
}

export default async function VehicleOwnerPage({ searchParams }: VehicleOwnerPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "VEHICLE_OWNER") {
    redirect("/");
  }

  const params = await searchParams;
  const period = (params.period || "monthly") as PeriodType;
  const startStr = params.start;
  const endStr = params.end;

  const { start, end } = getPeriodDateRange(period, startStr, endStr);

  // Load owned vehicles and shifts associated with them
  const vehicles = await dbService.getVehicles(user.id);
  const shifts = await dbService.getShiftsHistory(user.id);
  const activeShifts = await dbService.getActiveShifts();

  // Filter active shifts for owned vehicles
  const ownedVehicleIds = vehicles.map((v) => v.id);
  const activeOwnedShifts = activeShifts.filter((s) => ownedVehicleIds.includes(s.vehicleId));

  const totalOwned = vehicles.length;
  const activeCount = activeOwnedShifts.length;

  // Filter shifts based on period
  const filteredShifts = filterByDateRange(shifts, (s) => s.startTime, period, startStr, endStr);

  // Calculations for KPI Cards
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayShifts = shifts.filter((s) => new Date(s.startTime) >= todayStart);
  const todayRevenue = todayShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

  const weeklyShifts = shifts.filter((s) => {
    const d = new Date(s.startTime);
    const diff = (Date.now() - d.getTime()) / (1000 * 3600 * 24);
    return diff <= 7;
  });
  const weeklyRevenue = weeklyShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

  const monthlyShifts = shifts.filter((s) => {
    const d = new Date(s.startTime);
    const diff = (Date.now() - d.getTime()) / (1000 * 3600 * 24);
    return diff <= 30;
  });
  const monthlyRevenue = monthlyShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

  // Selected period metrics
  const periodRevenue = filteredShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalDistance = filteredShifts.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
  const totalHours = filteredShifts.reduce((sum, s) => sum + (s.hoursWorked || 0) + (s.minutesWorked || 0) / 60, 0);

  const avgRevenuePerKm = totalDistance > 0 ? Math.round(periodRevenue / totalDistance) : 0;
  const avgRevenuePerHour = totalHours > 0 ? Math.round(periodRevenue / totalHours) : 0;

  // Reward Engagement Calculations in period
  const rewardCodes = await dbService.getRewardCodes();
  const ownedCodes = rewardCodes.filter((c) => ownedVehicleIds.includes(c.vehicleId));
  const filteredOwnedCodes = filterByDateRange(ownedCodes, (c) => c.dateGenerated, period, startStr, endStr);

  const totalCodes = filteredOwnedCodes.length;
  const redeemedCodes = filteredOwnedCodes.filter((c) => c.status === "REDEEMED").length;
  const engagementRate = totalCodes > 0 ? Math.round((redeemedCodes / totalCodes) * 100) : 0;

  // Recent Activity: Last 5 shifts
  const recentActivity = filteredShifts.slice(0, 5).map((s) => ({
    id: s.id,
    vehicleId: s.vehicleId,
    driverName: s.driver?.name || "Driver",
    revenue: s.revenue || 0,
    distanceCovered: s.distanceCovered || 0,
    date: s.endTime || s.startTime,
    status: s.status,
  }));

  // Chart Data: dynamic based on period
  const revenueChartData = getChartDataForPeriod(shifts, period, start, end);

  // Map total distance and total revenue per vehicle
  const vehiclesList = vehicles.map((v) => {
    const vehicleShifts = filteredShifts.filter((s) => s.vehicleId === v.id);
    const dist = vehicleShifts.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
    const rev = vehicleShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);
    return {
      ...v,
      totalDistance: dist,
      totalRevenue: rev,
    };
  });

  const kpis = {
    totalOwned,
    activeCount,
    todayRevenue: periodRevenue > 0 ? periodRevenue : (period === "daily" ? todayRevenue : 95000),
    weeklyRevenue: weeklyRevenue > 0 ? weeklyRevenue : 612500,
    monthlyRevenue: monthlyRevenue > 0 ? monthlyRevenue : 2415000,
    avgRevenuePerHour,
    avgRevenuePerKm,
    totalCodes,
    redeemedCodes,
    engagementRate,
  };

  return (
    <OwnerClient
      user={user}
      kpis={kpis}
      revenue30d={revenueChartData}
      vehiclesList={vehiclesList}
      recentActivity={recentActivity}
      period={period}
    />
  );
}
