import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { PortalClient } from "@/components/portal-client";

export const dynamic = "force-dynamic";

export default async function PassengerPortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "PASSENGER") {
    redirect("/");
  }

  const allRedemptions = await dbService.getRedemptions();
  const passengerRedemptions = allRedemptions.filter(
    (r) => r.passengerId === user.id
  );

  return (
    <PortalClient
      user={user as any}
      redemptions={passengerRedemptions}
    />
  );
}
