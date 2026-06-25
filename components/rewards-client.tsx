"use client";

import { useState, useTransition } from "react";
import { deliverRewardAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RewardsClientProps {
  user: { name: string; role: string };
  redemptions: any[];
}

export function RewardsClient({ user, redemptions: initialRedemptions }: RewardsClientProps) {
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [isPending, startTransition] = useTransition();

  const handleDeliver = async (id: string) => {
    startTransition(async () => {
      const res = await deliverRewardAction(id);
      if (res.success) {
        toast.success("Reward approved & notification sent!");
        // Update local state
        setRedemptions((prev) =>
          prev.map((r) =>
            r.id === id
              ? { ...r, status: "DELIVERED", processedAt: new Date().toISOString() }
              : r
          )
        );
      } else {
        toast.error(res.error || "Failed to process reward");
      }
    });
  };

  return (
    <AppShell title="Reward Redemptions" description="Approve and deliver passenger rewards" user={user}>
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-base">Pending Approvals</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Send airtime or data manually outside the platform, then mark as delivered to notify passenger
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Passenger</th>
                <th className="px-6 py-3 hidden sm:table-cell">Phone</th>
                <th className="px-6 py-3">Reward Requested</th>
                <th className="px-6 py-3">Points Used</th>
                <th className="px-6 py-3 text-right">Status / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {redemptions.length > 0 ? (
                redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{r.passenger?.name || "Passenger"}</td>
                    <td className="px-6 py-4 hidden sm:table-cell font-mono text-muted-foreground">
                      {r.passenger?.phone || "—"}
                    </td>
                    <td className="px-6 py-4">{r.rewardRequested}</td>
                    <td className="px-6 py-4 font-mono font-bold text-brand">{r.pointsUsed} pts</td>
                    <td className="px-6 py-4 text-right">
                      {r.status === "PENDING_APPROVAL" ? (
                        <button
                          onClick={() => handleDeliver(r.id)}
                          disabled={isPending}
                          className="px-3 py-1.5 bg-brand text-brand-foreground text-xs font-bold rounded hover:bg-brand/90 transition-colors inline-flex items-center gap-1 disabled:opacity-50"
                        >
                          <Check className="size-3.5" /> Mark Delivered
                        </button>
                      ) : (
                        <span className="px-2 py-1 bg-brand/10 text-brand text-[10px] font-bold rounded uppercase tracking-wider">
                          Delivered
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-center text-xs text-muted-foreground">
                    No redemption requests.
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
