"use client";

import { useTransition, useState } from "react";
import { redeemCodeAction, requestRedemptionAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import { Gift, QrCode, Sparkles, Send, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PortalClientProps {
  user: { id: string; name: string; phone: string; role: string; points: number };
  redemptions: any[];
}

interface ValidationFeedback {
  type: "success" | "warning" | "error";
  message: string;
}

export function PortalClient({ user, redemptions: initialRedemptions }: PortalClientProps) {
  const [points, setPoints] = useState(user.points || 0);
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [isPending, startTransition] = useTransition();
  const [codeInputValue, setCodeInputValue] = useState("");
  const [feedback, setFeedback] = useState<ValidationFeedback | null>(null);
  const [activeTab, setActiveTab] = useState<"ALL" | "AIRTIME" | "DATA">("ALL");

  // Progress Bar thresholds
  const getNextGoal = (pts: number) => {
    if (pts < 100) return { goal: 100, diff: 100 - pts, text: "100MB Data or ₦100 Airtime" };
    if (pts < 300) return { goal: 300, diff: 300 - pts, text: "500MB Data" };
    if (pts < 600) return { goal: 600, diff: 600 - pts, text: "1GB Data" };
    return { goal: 1000, diff: 0, text: "Maximum Rewards Tier" };
  };

  const currentGoal = getNextGoal(points);
  const percentComplete = Math.min(100, Math.round((points / currentGoal.goal) * 100));

  const handleRedeemCodeSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!codeInputValue.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const res = await redeemCodeAction(codeInputValue, user.id);
      if (res.success) {
        setFeedback({
          type: "success",
          message: "✓ Code Accepted: 10 Points Added Successfully",
        });
        setPoints((p) => p + 10);
        setCodeInputValue("");
        toast.success("Points added successfully!");
      } else {
        const errorText = res.error || "";
        if (errorText.toLowerCase().includes("already") || errorText.toLowerCase().includes("used")) {
          setFeedback({
            type: "warning",
            message: "⚠ This code has already been used.",
          });
        } else {
          setFeedback({
            type: "error",
            message: "✗ Invalid reward code. Please check the code and try again.",
          });
        }
      }
    });
  };

  const handleRewardRedeem = async (reward: string, ptsCost: number) => {
    if (points < ptsCost) {
      toast.error("Insufficient points balance!");
      return;
    }
    startTransition(async () => {
      const res = await requestRedemptionAction(reward, ptsCost, user.id);
      if (res.success) {
        toast.success(`Request for ${reward} submitted for approval!`);
        setPoints((p) => p - ptsCost);
        setRedemptions((prev) => [
          {
            id: `r-${Date.now()}`,
            rewardRequested: reward,
            pointsUsed: ptsCost,
            status: "PENDING_APPROVAL",
            requestedAt: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        toast.error(res.error || "Failed to submit request");
      }
    });
  };

  const REWARDS = [
    { label: "100MB Data", cost: 100, desc: "Fast mobile data topup", type: "DATA" as const },
    { label: "₦100 Airtime", cost: 100, desc: "Call credit for any network", type: "AIRTIME" as const },
    { label: "500MB Data", cost: 300, desc: "Medium data package", type: "DATA" as const },
    { label: "1GB Data", cost: 600, desc: "Premium mobile data volume", type: "DATA" as const },
  ];

  const filteredRewards = REWARDS.filter(
    (r) => activeTab === "ALL" || r.type === activeTab
  );

  return (
    <AppShell title="Commuter Portal" description="Enter ride codes and track your points" user={user}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-up">
        {/* Points Summary & Progress Bar */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Sparkles className="size-5 text-brand" /> Points Balance
              </h3>
              <span className="px-3 py-1 bg-brand/10 text-brand text-xs font-bold rounded-full font-mono">
                {points} Points
              </span>
            </div>
 
            {/* Gamified progress bar */}
            <div className="space-y-4">
              <div className="flex justify-between text-[11px] sm:text-xs font-semibold flex-wrap gap-1">
                <span className="text-muted-foreground">{points} / {currentGoal.goal} pts</span>
                {currentGoal.diff > 0 ? (
                  <span className="text-brand font-medium">
                    {currentGoal.diff} Points away from your {currentGoal.text}
                  </span>
                ) : (
                  <span className="text-brand font-medium">Top Tier Commuter!</span>
                )}
              </div>
              <div className="relative pt-1">
                <div className="w-full bg-surface border border-border h-4 rounded-full overflow-hidden">
                  <div
                    className="bg-brand h-full transition-all duration-500 rounded-full"
                    style={{ width: `${percentComplete}%` }}
                  />
                </div>
                {/* Milestone Tickmarks */}
                <div className="flex justify-between text-[9px] font-bold text-muted-foreground mt-2 px-1 relative">
                  <span className={cn(points >= 100 ? "text-brand" : "")}>100 pts (100MB)</span>
                  <span className={cn(points >= 300 ? "text-brand" : "")}>300 pts (500MB)</span>
                  <span className={cn(points >= 600 ? "text-brand" : "")}>600 pts (1GB)</span>
                </div>
              </div>
            </div>
          </div>
 
          {/* Airtime vs Data Selection Tabs and Cards */}
          <div className="space-y-4 pt-6 border-t border-border mt-6">
            <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border max-w-sm">
              {(["ALL", "AIRTIME", "DATA"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer uppercase",
                    activeTab === tab
                      ? "bg-white text-brand shadow-sm border border-border/10"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab === "ALL" ? "All" : tab === "AIRTIME" ? "Airtime" : "Data"}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredRewards.map((r) => (
                <div
                  key={r.label}
                  className={cn(
                    "p-4 rounded-xl border flex items-center justify-between gap-4 transition-all",
                    points >= r.cost
                      ? "border-brand/20 bg-brand-soft/10"
                      : "border-border bg-surface/50 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "size-10 rounded-lg flex items-center justify-center shrink-0",
                      points >= r.cost ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                    )}>
                      <Gift className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{r.label}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{r.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold font-mono text-brand mb-1.5">{r.cost} pts</p>
                    <button
                      onClick={() => handleRewardRedeem(r.label, r.cost)}
                      disabled={points < r.cost || isPending}
                      className={cn(
                        "px-3 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer",
                        points >= r.cost
                          ? "bg-brand text-brand-foreground hover:bg-brand/90"
                          : "bg-surface border border-border text-muted-foreground cursor-not-allowed"
                      )}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enter Code Box */}
        <div className="bg-white border border-border rounded-xl shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-base mb-1 flex items-center gap-1.5">
                <QrCode className="size-5 text-brand" /> Enter Commute Code
              </h3>
              <p className="text-xs text-muted-foreground">
                Enter the unique code printed on your MUVA receipt/ticket to earn 10 points
              </p>
            </div>

            <form onSubmit={handleRedeemCodeSubmit} className="space-y-4">
              {feedback && (
                <div
                  className={cn(
                    "p-3 rounded-lg border text-xs font-semibold flex items-start gap-2 animate-fade-up",
                    feedback.type === "success"
                      ? "bg-brand/10 border-brand/20 text-brand"
                      : feedback.type === "warning"
                      ? "bg-warn-soft border-warn/25 text-warn"
                      : "bg-danger-soft border-danger/25 text-danger"
                  )}
                >
                  {feedback.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0 mt-0.5" />
                  ) : feedback.type === "warning" ? (
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="size-4 shrink-0 mt-0.5" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="code" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Receipt Code
                </label>
                <input
                  id="code"
                  type="text"
                  value={codeInputValue}
                  onChange={(e) => setCodeInputValue(e.target.value)}
                  placeholder="e.g. MUV-7K4P9M"
                  required
                  disabled={isPending}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none uppercase"
                />
              </div>
              <button
                type="submit"
                disabled={isPending || !codeInputValue.trim()}
                className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Send className="size-4" /> Earn Points
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Passenger Redemption History */}
      <section className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up mt-6">
        <div className="p-5 border-b border-border">
          <h3 className="font-bold text-base">Redemption History</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Track status of your requested airtime and data rewards</p>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Reward Item</th>
                <th className="px-6 py-3">Points Exchanged</th>
                <th className="px-6 py-3">Date Requested</th>
                <th className="px-6 py-3 text-right">Delivery Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {redemptions.length > 0 ? (
                redemptions.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-semibold">{r.rewardRequested}</td>
                    <td className="px-6 py-4 font-mono">{r.pointsUsed} pts</td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(r.requestedAt).toLocaleDateString("en-NG", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider",
                          r.status === "PENDING_APPROVAL"
                            ? "bg-warn-soft text-warn"
                            : "bg-brand/10 text-brand"
                        )}
                      >
                        {r.status === "PENDING_APPROVAL" ? "Pending" : "Delivered"}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-xs text-muted-foreground">
                    You haven't requested any rewards yet. Keep riding to collect points!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile List View */}
        <div className="block md:hidden divide-y divide-border">
          {redemptions.length > 0 ? (
            redemptions.map((r) => (
              <div key={r.id} className="p-4 space-y-2 hover:bg-surface/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{r.rewardRequested}</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider",
                      r.status === "PENDING_APPROVAL"
                        ? "bg-warn-soft text-warn"
                        : "bg-brand/10 text-brand"
                    )}
                  >
                    {r.status === "PENDING_APPROVAL" ? "Pending" : "Delivered"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{r.pointsUsed} pts exchanged</span>
                  <span>
                    {new Date(r.requestedAt).toLocaleDateString("en-NG", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              You haven't requested any rewards yet. Keep riding to collect points!
            </div>
          )}
        </div>
      </section>
    </AppShell>
  );
}
