import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { RewardsClient } from "@/components/rewards-client";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  const redemptions = await dbService.getRedemptions();

  return <RewardsClient user={user} redemptions={redemptions} />;
}
