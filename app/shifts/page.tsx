import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { ShiftsClient } from "@/components/shifts-client";

export const dynamic = "force-dynamic";

export default async function ShiftsPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const activeShifts = await dbService.getActiveShifts();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();

  return (
    <ShiftsClient
      user={user}
      activeShifts={activeShifts}
      vehicles={vehicles}
      drivers={drivers}
    />
  );
}
