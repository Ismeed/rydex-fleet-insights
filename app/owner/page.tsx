import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { OwnerClient } from "@/components/owner-client";
import { filterByDateRange, getPeriodDateRange, getChartDataForPeriod, PeriodType } from "@/lib/date-filters";

export const dynamic = "force-dynamic";

interface CompanyOwnerPageProps {
  searchParams?: Promise<{
    period?: string;
    start?: string;
    end?: string;
  }> | any;
}

export default async function CompanyOwnerPage({ searchParams }: CompanyOwnerPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "COMPANY_OWNER") {
    redirect("/");
  }

  const companyId = user.companyId;
  if (!companyId) {
    redirect("/login");
  }

  // Load the company info
  const company = await dbService.getCompanyById(companyId);
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

  // Load owned vehicles, shifts, drivers, and contracts
  const vehicles = await dbService.getVehicles(companyId);
  const shifts = await dbService.getShiftsHistory(companyId);
  const drivers = await dbService.getDrivers(companyId);
  const contracts = await dbService.getHirePurchaseContracts(companyId);
  const maintenances = await dbService.getMaintenanceJobs(companyId);

  // 1. Vehicles states count
  const totalVehiclesCount = vehicles.length;
  const onRoadCount = vehicles.filter((v) => v.status === "ON_ROAD").length;
  const availableCount = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const maintenanceCount = vehicles.filter((v) => v.status === "MAINTENANCE").length;

  // 2. Drivers status
  const activeDriversCount = drivers.filter((d) => d.status === "active").length;
  const absentDriversCount = totalVehiclesCount - onRoadCount; // simple operational mapping

  // 3. HP Contracts status
  const activeContractsCount = contracts.filter((c) => c.status === "ACTIVE").length;
  const completedContractsCount = contracts.filter((c) => c.status === "COMPLETED").length;

  // Filter shifts based on period
  const filteredShifts = filterByDateRange(shifts, (s) => s.startTime, period, startStr, endStr);

  // 4. Revenue & outstanding calculations
  const periodRevenue = filteredShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);
  const outstandingRemittance = filteredShifts.reduce((sum, s) => sum + (s.outstandingBalance || 0), 0);
  
  const totalDistance = filteredShifts.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
  const totalHours = filteredShifts.reduce((sum, s) => sum + (s.hoursWorked || 0) + (s.minutesWorked || 0) / 60, 0);

  const avgRevenuePerKm = totalDistance > 0 ? Math.round(periodRevenue / totalDistance) : 0;
  const avgRevenuePerHour = totalHours > 0 ? Math.round(periodRevenue / totalHours) : 0;

  // Recent Activity: Last 5 shifts
  const recentActivity = filteredShifts.slice(0, 5).map((s) => ({
    id: s.id,
    vehicleId: s.vehicleId,
    driverName: s.driver?.name || "Driver",
    revenue: s.revenue || 0,
    distanceCovered: s.distanceCovered || 0,
    date: s.endTime || s.startTime,
    status: s.status,
    amountReceived: s.amountReceived,
    outstandingBalance: s.outstandingBalance,
  }));

  // Chart Data: dynamic based on period
  const revenueChartData = getChartDataForPeriod(shifts, period, start, end);

  // Map total distance, total revenue, and HP progress per vehicle
  const vehiclesList = vehicles.map((v) => {
    const vehicleShifts = filteredShifts.filter((s) => s.vehicleId === v.id);
    const dist = vehicleShifts.reduce((sum, s) => sum + (s.distanceCovered || 0), 0);
    const rev = vehicleShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const contract = contracts.find((c) => c.vehicleId === v.id && c.status === "ACTIVE");
    
    return {
      ...v,
      totalDistance: dist,
      totalRevenue: rev,
      contractProgress: contract 
        ? Math.round((contract.totalPaid / contract.targetAmount) * 100) 
        : null,
    };
  });

  const kpis = {
    totalVehiclesCount,
    onRoadCount,
    availableCount,
    maintenanceCount,
    activeDriversCount,
    absentDriversCount,
    activeContractsCount,
    completedContractsCount,
    periodRevenue,
    outstandingRemittance,
    avgRevenuePerHour,
    avgRevenuePerKm,
    totalDistance,
  };

  return (
    <OwnerClient
      user={user}
      kpis={kpis}
      revenue30d={revenueChartData}
      vehiclesList={vehiclesList}
      recentActivity={recentActivity}
      period={period}
      companyName={companyName}
      maintenances={maintenances.slice(0, 5)}
    />
  );
}
