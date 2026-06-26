import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { OfficerDashboardClient } from "@/components/officer-client";

export const dynamic = "force-dynamic";

export default async function OfficerDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "OPERATIONS_OFFICER" && user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  // Load database information
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const shifts = await dbService.getShiftsHistory();
  const activeShifts = await dbService.getActiveShifts();
  const batches = await dbService.getBatches();

  // Define today's time bounds
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Today's shifts
  const todayShifts = shifts.filter((s) => {
    const d = new Date(s.startTime);
    return d >= todayStart && d <= todayEnd;
  });

  const completedShiftsToday = todayShifts.filter((s) => s.endTime !== null);
  const activeShiftsToday = activeShifts; // All active shifts are current

  // Today's Revenue
  const todayRevenue = completedShiftsToday.reduce((sum, s) => sum + (s.revenue || 0), 0);

  // Vehicles waiting for shift (ACTIVE status but no active shift currently)
  const activeShiftVehicleIds = activeShifts.map((s) => s.vehicleId.toLowerCase());
  const vehiclesWaiting = vehicles.filter(
    (v) => v.status === "ACTIVE" && !activeShiftVehicleIds.includes(v.id.toLowerCase())
  );

  // Vehicles returned (ended today)
  const returnedVehicleIds = completedShiftsToday.map((s) => s.vehicleId.toLowerCase());
  const vehiclesReturned = vehicles.filter((v) => returnedVehicleIds.includes(v.id.toLowerCase()));

  // Batches generated today
  const todayBatches = batches.filter((b) => {
    const d = new Date(b.dateGenerated);
    return d >= todayStart && d <= todayEnd;
  });

  // Reward slips printed today (sum of print history counts created today)
  let slipsPrintedToday = 0;
  todayBatches.forEach((b) => {
    try {
      const history = JSON.parse(b.printHistory || "[]");
      slipsPrintedToday += history.length;
    } catch (e) {
      slipsPrintedToday += b.printCount || 0;
    }
  });

  // Active batches count
  const batchesAvailable = batches.length;

  // Chronological Daily Activity Feed Timeline
  const activityFeed: any[] = [];
  
  // 1. Shift Starts
  todayShifts.forEach((s) => {
    activityFeed.push({
      id: `act-start-${s.id}`,
      time: new Date(s.startTime),
      timeLabel: new Date(s.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      type: "start",
      text: `Vehicle ${s.vehicleId.toUpperCase()} Shift Started`,
      detail: `Driver: ${s.driver?.name || "Driver"} • Odo: ${s.startOdometer} KM`,
    });
  });

  // 2. Shift Ends
  completedShiftsToday.forEach((s) => {
    activityFeed.push({
      id: `act-end-${s.id}`,
      time: new Date(s.endTime || ""),
      timeLabel: new Date(s.endTime || "").toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      type: "end",
      text: `Vehicle ${s.vehicleId.toUpperCase()} Shift Ended`,
      detail: `Odo: ${s.endOdometer} KM • Revenue submitted: NGN ${(s.revenue || 0).toLocaleString()}`,
    });
  });

  // 3. Batches Generated Today
  todayBatches.forEach((b) => {
    activityFeed.push({
      id: `act-batch-${b.id}`,
      time: new Date(b.dateGenerated),
      timeLabel: new Date(b.dateGenerated).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      type: "batch",
      text: `Reward Batch ${b.batchNumber} Generated`,
      detail: `${b.codeCount} slips generated for Vehicle ${b.vehicleId.toUpperCase()}`,
    });
  });

  // Sort timeline descending
  activityFeed.sort((a, b) => b.time.getTime() - a.time.getTime());

  return (
    <OfficerDashboardClient
      user={user}
      vehiclesWaitingCount={vehiclesWaiting.length}
      activeVehiclesCount={activeShiftsToday.length}
      vehiclesReturnedCount={vehiclesReturned.length}
      activeShifts={activeShiftsToday}
      completedShiftsToday={completedShiftsToday}
      todayRevenue={todayRevenue}
      batchesAvailable={batchesAvailable}
      slipsPrintedToday={slipsPrintedToday}
      activityFeed={activityFeed}
      vehicles={vehicles}
      drivers={drivers}
      batches={batches}
    />
  );
}
