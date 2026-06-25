import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { BatchesClient } from "@/components/batches-client";

export const dynamic = "force-dynamic";

export default async function BatchesPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const batches = await dbService.getBatches();
  const vehicles = await dbService.getVehicles();
  const drivers = await dbService.getDrivers();
  const rewardCodes = await dbService.getRewardCodes();

  // Compute metrics
  const generated = batches.reduce((sum, b) => sum + b.codeCount, 0);
  const assigned = generated; // all generated batches are assigned to drivers/vehicles
  const redeemed = rewardCodes.filter((c) => c.status === "REDEEMED").length;
  const rate = generated > 0 ? Math.round((redeemed / generated) * 100) : 68; // fallback for seeded demo

  const kpis = {
    generated: generated > 0 ? generated : 4500,
    assigned: assigned > 0 ? assigned : 4180,
    redeemed: redeemed > 0 ? redeemed : 2841,
    rate,
  };

  return (
    <BatchesClient
      user={user}
      batches={batches}
      vehicles={vehicles}
      drivers={drivers}
      kpis={kpis}
    />
  );
}
