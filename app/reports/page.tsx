import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { ReportsClient } from "@/components/reports-client";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const shifts = await dbService.getShiftsHistory();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const redemptions = await dbService.getRedemptions();

  return (
    <ReportsClient
      user={user}
      shifts={shifts}
      vehicles={vehicles}
      drivers={drivers}
      redemptions={redemptions}
    />
  );
}
