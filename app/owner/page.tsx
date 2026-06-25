import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { OwnerClient } from "@/components/owner-client";

export const dynamic = "force-dynamic";

export default async function VehicleOwnerPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "VEHICLE_OWNER") {
    redirect("/");
  }

  // Load owned vehicles and shifts associated with them
  const vehicles = await dbService.getVehicles(user.id);
  const shifts = await dbService.getShiftsHistory(user.id);
  const activeShifts = await dbService.getActiveShifts();

  // Filter active shifts for owned vehicles
  const ownedVehicleIds = vehicles.map((v) => v.id);
  const activeOwnedShifts = activeShifts.filter((s) => ownedVehicleIds.includes(s.vehicleId));

  const totalOwned = vehicles.length;
  const activeCount = activeOwnedShifts.length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Filter ended shifts for today
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

  // Compute averages
  const totalRev = shifts.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const totalDistance = shifts.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
  const totalHours = shifts.reduce((sum, s) => sum + (s.hoursWorked || 0) + (s.minutesWorked || 0) / 60, 0);

  const avgRevenuePerKm = totalDistance > 0 ? Math.round(totalRev / totalDistance) : 0;
  const avgRevenuePerHour = totalHours > 0 ? Math.round(totalRev / totalHours) : 0;

  // Reward Engagement Calculations
  const rewardCodes = await dbService.getRewardCodes();
  const ownedCodes = rewardCodes.filter((c) => ownedVehicleIds.includes(c.vehicleId));
  const totalCodes = ownedCodes.length;
  const redeemedCodes = ownedCodes.filter((c) => c.status === "REDEEMED").length;
  const engagementRate = totalCodes > 0 ? Math.round((redeemedCodes / totalCodes) * 100) : 0;

  // Recent Activity: Last 5 shifts
  const recentActivity = shifts.slice(0, 5).map((s) => ({
    id: s.id,
    vehicleId: s.vehicleId,
    driverName: s.driver?.name || "Driver",
    revenue: s.revenue || 0,
    distanceCovered: s.distanceCovered || 0,
    date: s.endTime || s.startTime,
    status: s.status,
  }));

  // Chart Data: Last 30 days revenue
  const revenue30d = Array.from({ length: 30 }, (_, i) => {
    const dayDate = new Date();
    dayDate.setDate(dayDate.getDate() - (29 - i));
    const dayLabel = dayDate.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
    
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const dayShifts = shifts.filter((s) => {
      const d = new Date(s.startTime);
      return d >= dayStart && d <= dayEnd;
    });
    
    const daySum = dayShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

    return {
      label: dayLabel,
      revenue: daySum,
    };
  });

  // Map total distance and total revenue per vehicle
  const vehiclesList = vehicles.map((v) => {
    const vehicleShifts = shifts.filter((s) => s.vehicleId === v.id);
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
    todayRevenue,
    weeklyRevenue,
    monthlyRevenue,
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
      revenue30d={revenue30d}
      vehiclesList={vehiclesList}
      recentActivity={recentActivity}
    />
  );
}
