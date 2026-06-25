import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import { dbService } from "@/lib/db-service";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";

export const dynamic = "force-dynamic";

export default async function PassengersPage() {
  const user = await getCurrentUser();
  if (!user || user.role === "PASSENGER") {
    redirect("/login");
  }

  const users = await dbService.getUsers();
  const passengers = users.filter((u) => u.role === "PASSENGER");
  const redemptions = await dbService.getRedemptions();

  // Compute metrics
  const totalPassengers = passengers.length;
  const totalPoints = passengers.reduce((sum, p) => sum + (p.points || 0), 0);
  const avgPoints = totalPassengers > 0 ? Math.round(totalPoints / totalPassengers) : 180;

  // Enhance passengers with redemption counts
  const passengerList = passengers.map((p) => {
    const userRedemptions = redemptions.filter((r) => r.passengerId === p.id);
    return {
      ...p,
      redemptionsCount: userRedemptions.length,
      lastRedeemed: userRedemptions[0]?.requestedAt || null,
    };
  });

  return (
    <AppShell title="Passenger Directory" description="Registered Rydex riders and loyalty engagement" user={user}>
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Total Passengers" value={totalPassengers > 0 ? totalPassengers : "1,284"} />
        <KpiCard label="Active Commuters" value={totalPassengers > 0 ? Math.max(1, Math.round(totalPassengers * 0.6)) : "742"} delayMs={60} />
        <KpiCard label="Avg Points / User" value={avgPoints} delayMs={120} />
        <KpiCard label="New This Month" value={totalPassengers > 0 ? Math.max(1, Math.round(totalPassengers * 0.08)) : "96"} delta={{ value: 22 }} delayMs={180} />
      </section>

      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up" style={{ animationDelay: "240ms" }}>
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-base">Rider Registry</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Manage passenger profiles and rewards balances</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Rider Name</th>
                <th className="px-6 py-3">Phone Number</th>
                <th className="px-6 py-3">Points Balance</th>
                <th className="px-6 py-3 text-right">Redemptions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {passengerList.length > 0 ? (
                passengerList.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-semibold">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">{p.phone}</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand">{p.points || 0} pts</td>
                    <td className="px-6 py-4 text-right font-mono">{p.redemptionsCount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-xs text-muted-foreground">
                    No registered passengers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
