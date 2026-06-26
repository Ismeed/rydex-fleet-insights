"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  startShiftAction,
  endShiftAction,
  recordDailyRevenueAction,
  generateBatchAction,
  recordBatchPrintAction,
} from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { generateRewardSlipsPDF } from "@/lib/pdf-generator";
import { naira, compactNaira } from "@/lib/format";
import { toast } from "sonner";
import {
  Play,
  Square,
  DollarSign,
  QrCode,
  Printer,
  X,
  Plus,
  Clock,
  Car,
  Users,
  CheckCircle,
  FileText,
  Activity,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OfficerDashboardClientProps {
  user: { name: string; role: string };
  vehiclesWaitingCount: number;
  activeVehiclesCount: number;
  vehiclesReturnedCount: number;
  activeShifts: any[];
  completedShiftsToday: any[];
  todayRevenue: number;
  batchesAvailable: number;
  slipsPrintedToday: number;
  activityFeed: any[];
  vehicles: any[];
  drivers: any[];
  batches: any[];
}

export function OfficerDashboardClient({
  user,
  vehiclesWaitingCount,
  activeVehiclesCount,
  vehiclesReturnedCount,
  activeShifts,
  completedShiftsToday,
  todayRevenue,
  batchesAvailable,
  slipsPrintedToday,
  activityFeed,
  vehicles,
  drivers,
  batches,
}: OfficerDashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal Open States
  const [activeModal, setActiveModal] = useState<
    "start" | "end" | "revenue" | "generate" | "print" | null
  >(null);
  
  // Selected Active Shift for Ending
  const [selectedShiftForEnd, setSelectedShiftForEnd] = useState<string>("");

  // Action states
  const [startState, startFormAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await startShiftAction(prevState, formData);
      if (res.success) {
        toast.success("Shift started successfully!");
        setActiveModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to start shift");
      }
      return res;
    },
    null
  );

  const [endState, endFormAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await endShiftAction(prevState, formData);
      if (res.success) {
        toast.success("Shift ended and revenue compiled!");
        setActiveModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to end shift");
      }
      return res;
    },
    null
  );

  const [revenueState, revenueFormAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await recordDailyRevenueAction(prevState, formData);
      if (res.success) {
        toast.success("Daily revenue logged successfully!");
        setActiveModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to log revenue");
      }
      return res;
    },
    null
  );

  const [generateState, generateFormAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await generateBatchAction(prevState, formData);
      if (res.success) {
        toast.success("Reward codes batch generated!");
        setActiveModal(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to generate codes");
      }
      return res;
    },
    null
  );

  // PDF slip downloader
  const handleDownloadPDF = async (batch: any) => {
    if (!batch.codes || batch.codes.length === 0) {
      toast.error("No reward codes available in this batch.");
      return;
    }
    
    const validCodes = batch.codes
      .map((c: any) => c.code)
      .filter((code: string) => code && !code.includes("XXXXXX"));

    if (validCodes.length === 0) {
      toast.error("No valid reward codes found.");
      return;
    }

    const currentCount = batch.printCount || 0;
    if (currentCount >= 3) {
      toast.error("Maximum print limit (3) reached for this batch.");
      return;
    }

    const dateString = new Date().toISOString().split("T")[0];
    const filename = `MUVA_Reward_Codes_${batch.batchNumber}_${dateString}.pdf`;

    try {
      generateRewardSlipsPDF(validCodes, filename);
      toast.success(`PDF downloaded: ${filename}`);

      const res = await recordBatchPrintAction(batch.id, user.name);
      if (res.success) {
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to generate PDF document.");
    }
  };

  // Find dispatched vehicles and drivers
  const activeVehicleIds = activeShifts.map((s) => s.vehicleId.toLowerCase());
  const activeDriverIds = activeShifts.map((s) => s.driverId);

  return (
    <AppShell
      title="Daily Operations Control Center"
      description="Live park dispatch, shift management, and print queue"
      user={user}
    >
      {/* 1. Large Quick Actions Deck */}
      <section className="bg-white border border-border rounded-xl p-5 shadow-sm mb-6 animate-fade-up">
        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
          Primary Dispatch Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <button
            onClick={() => setActiveModal("start")}
            className="flex flex-col items-center justify-center p-4 bg-brand hover:bg-brand/95 text-white font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer text-center gap-2"
          >
            <Play className="size-5" strokeWidth={2.5} />
            <span className="text-xs">Start Shift</span>
          </button>

          <button
            onClick={() => {
              if (activeShifts.length > 0) {
                setSelectedShiftForEnd(activeShifts[0].id);
              }
              setActiveModal("end");
            }}
            className="flex flex-col items-center justify-center p-4 bg-danger hover:bg-danger/95 text-white font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer text-center gap-2"
          >
            <Square className="size-5" strokeWidth={2.5} />
            <span className="text-xs">End Shift</span>
          </button>

          <button
            onClick={() => setActiveModal("revenue")}
            className="flex flex-col items-center justify-center p-4 bg-surface-dark bg-charcoal text-white hover:bg-charcoal/95 font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02] cursor-pointer text-center gap-2"
          >
            <DollarSign className="size-5" strokeWidth={2.5} />
            <span className="text-xs">Record Revenue</span>
          </button>

          <button
            onClick={() => setActiveModal("generate")}
            className="flex flex-col items-center justify-center p-4 bg-brand-soft border border-brand/20 text-brand font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer text-center gap-2"
          >
            <QrCode className="size-5" strokeWidth={2.5} />
            <span className="text-xs">Generate Codes</span>
          </button>

          <button
            onClick={() => setActiveModal("print")}
            className="flex flex-col items-center justify-center p-4 bg-warning-soft border border-warning/20 text-warning-dark font-bold rounded-xl transition-all hover:scale-[1.02] cursor-pointer text-center gap-2 col-span-2 md:col-span-1"
          >
            <Printer className="size-5" strokeWidth={2.5} />
            <span className="text-xs">Print Slips</span>
          </button>
        </div>
      </section>

      {/* 2. Today's Stats Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Waiting for Shift"
          value={vehiclesWaitingCount}
          badge={{ label: "Idle Park", tone: "muted" }}
        />
        <KpiCard
          label="Active on Road"
          value={activeVehiclesCount}
          badge={{ label: "Active", tone: "brand" }}
          delayMs={60}
        />
        <KpiCard
          label="Completed Shifts"
          value={completedShiftsToday.length}
          badge={{ label: "Returned", tone: "brand" }}
          delayMs={120}
        />
        <KpiCard
          label="Today's Revenue"
          value={compactNaira(todayRevenue)}
          badge={{ label: "Collected", tone: "brand" }}
          delayMs={180}
        />
        <KpiCard
          label="Batches Available"
          value={batchesAvailable}
          hint="Total generated"
          delayMs={240}
        />
        <KpiCard
          label="Slips Printed Today"
          value={slipsPrintedToday}
          hint="Total downloads"
          delayMs={300}
        />
      </section>

      {/* 3. Live Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        
        {/* Left Side: Queues */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Shifts Queue */}
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-fade-up">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Active Shifts Queue</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Vehicles currently on route. Click end shift to record revenue.
                </p>
              </div>
              <span className="px-2.5 py-0.5 bg-brand/10 text-brand text-[10px] font-bold uppercase rounded-full">
                {activeShifts.length} Live
              </span>
            </div>
            <div className="divide-y divide-border">
              {activeShifts.length > 0 ? (
                activeShifts.map((s) => (
                  <div
                    key={s.id}
                    className="p-5 flex items-center justify-between gap-4 hover:bg-surface/50 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-brand">{s.vehicleId.toUpperCase()}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {s.driver?.name || "Driver"} • Started:{" "}
                        {new Date(s.startTime).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        • Odo: {s.startOdometer} KM
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedShiftForEnd(s.id);
                        setActiveModal("end");
                      }}
                      className="px-3.5 py-1.5 bg-danger-soft hover:bg-danger/10 text-danger text-xs font-bold rounded transition-colors shrink-0"
                    >
                      End Shift
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No active vehicle shifts on road right now.
                </div>
              )}
            </div>
          </div>

          {/* Today's Completed Shifts */}
          <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: "100ms" }}>
            <div className="p-5 border-b border-border">
              <h3 className="font-bold text-base">Completed Shifts Today</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Shifts ended and revenue logged today
              </p>
            </div>
            <div className="overflow-x-auto">
              {completedShiftsToday.length > 0 ? (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-surface text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border">
                      <th className="p-4">Vehicle</th>
                      <th className="p-4">Driver</th>
                      <th className="p-4">Duration</th>
                      <th className="p-4">Distance</th>
                      <th className="p-4">Revenue</th>
                      <th className="p-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {completedShiftsToday.map((s) => (
                      <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-brand">{s.vehicleId.toUpperCase()}</td>
                        <td className="p-4">{s.driver?.name || "Driver"}</td>
                        <td className="p-4 text-muted-foreground">
                          {s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "—"}
                        </td>
                        <td className="p-4 text-muted-foreground font-mono">
                          {s.distanceCovered !== null ? `${s.distanceCovered} KM` : "—"}
                        </td>
                        <td className="p-4 font-semibold text-foreground">
                          {naira(s.revenue || 0)}
                        </td>
                        <td className="p-4 text-right">
                          <span
                            className={cn(
                              "px-2 py-0.5 text-[9px] font-bold rounded uppercase border",
                              s.status === "FLAGGED"
                                ? "bg-danger-soft text-danger border-danger/10"
                                : "bg-brand/10 text-brand border-brand/10"
                            )}
                          >
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No shifts completed yet today.
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Live Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 shadow-sm animate-fade-up" style={{ animationDelay: "150ms" }}>
            <h3 className="font-bold text-base mb-4 flex items-center gap-1.5">
              <Activity className="size-4.5 text-brand" /> Today's Operations Feed
            </h3>
            <div className="relative border-l border-border pl-4 space-y-5 ml-2.5">
              {activityFeed.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 pl-1">No activities logged today.</p>
              ) : (
                activityFeed.map((act) => (
                  <div key={act.id} className="relative text-xs">
                    {/* Circle bullet */}
                    <div
                      className={cn(
                        "absolute -left-[22.5px] top-0.5 size-3.5 rounded-full border bg-white grid place-items-center font-bold text-[8px]",
                        act.type === "start"
                          ? "border-brand text-brand"
                          : act.type === "end"
                          ? "border-danger text-danger"
                          : "border-warning text-warning-dark"
                      )}
                    >
                      {act.type === "start" ? "▶" : act.type === "end" ? "■" : "★"}
                    </div>
                    
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-bold text-foreground">{act.text}</span>
                      <span className="text-[9px] font-mono text-muted-foreground bg-surface px-1.5 py-0.5 rounded shrink-0">
                        {act.timeLabel}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 leading-relaxed">{act.detail}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* --- MODALS DECK --- */}
      
      {/* 1. START SHIFT MODAL */}
      {activeModal === "start" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-md animate-fade-up relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-1">Dispatch Vehicle Shift</h3>
            <p className="text-xs text-muted-foreground mb-4">Start a new morning shift</p>

            <form action={startFormAction} className="space-y-4">
              {startState?.error && (
                <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                  {startState.error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle</label>
                <select name="vehicleId" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="">Select vehicle...</option>
                  {vehicles
                    .filter((v) => v.status === "ACTIVE" && !activeVehicleIds.includes(v.id.toLowerCase()))
                    .map((v) => (
                      <option key={v.id} value={v.id}>{v.id.toUpperCase()} ({v.plateNumber})</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Driver</label>
                <select name="driverId" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="">Select driver...</option>
                  {drivers
                    .filter((d) => d.status === "active" && !activeDriverIds.includes(d.id))
                    .map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Starting Odometer (KM)</label>
                <input name="startOdometer" type="number" step="0.1" required placeholder="e.g. 12450.2" className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none" />
              </div>

              <button type="submit" className="w-full bg-brand text-brand-foreground py-2 rounded text-sm font-bold hover:bg-brand/95 cursor-pointer">
                Dispatch Shift
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. END SHIFT MODAL */}
      {activeModal === "end" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-md animate-fade-up relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-1">End Active Shift</h3>
            <p className="text-xs text-muted-foreground mb-4">Record closing odometer and revenue collected</p>

            <form action={endFormAction} className="space-y-4">
              {endState?.error && (
                <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                  {endState.error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Active Route</label>
                <select
                  name="shiftId"
                  value={selectedShiftForEnd}
                  onChange={(e) => setSelectedShiftForEnd(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none"
                >
                  <option value="">Select shift...</option>
                  {activeShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.vehicleId.toUpperCase()} - {s.driver?.name} (Start: {s.startOdometer} KM)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ending Odometer (KM)</label>
                <input name="endOdometer" type="number" step="0.1" required placeholder="e.g. 12560.5" className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue Submitted (₦)</label>
                <input name="revenue" type="number" required placeholder="e.g. 15000" className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none" />
              </div>

              <button type="submit" className="w-full bg-danger text-white py-2 rounded text-sm font-bold hover:bg-danger/95 cursor-pointer">
                Save & End Shift
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. RECORD REVENUE MODAL */}
      {activeModal === "revenue" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-md animate-fade-up relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-1">Record Daily Revenue</h3>
            <p className="text-xs text-muted-foreground mb-4">Log collected cash deposits</p>

            <form action={revenueFormAction} className="space-y-4">
              {revenueState?.error && (
                <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                  {revenueState.error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle</label>
                <select name="vehicleId" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.id.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Driver</label>
                <select name="driverId" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="">Select driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Revenue (₦)</label>
                <input name="revenue" type="number" required placeholder="e.g. 12000" className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date</label>
                <input name="date" type="date" required defaultValue={new Date().toISOString().split("T")[0]} className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none font-mono" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notes (Optional)</label>
                <textarea name="notes" placeholder="Any details..." className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none" />
              </div>

              <button type="submit" className="w-full bg-charcoal text-white py-2 rounded text-sm font-bold hover:bg-charcoal/95 cursor-pointer">
                Submit Revenue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. GENERATE CODES MODAL */}
      {activeModal === "generate" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-md animate-fade-up relative">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-1">Generate Reward Codes</h3>
            <p className="text-xs text-muted-foreground mb-4">Create new batches of commuter voucher slips</p>

            <form action={generateFormAction} className="space-y-4">
              {generateState?.error && (
                <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                  {generateState.error}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vehicle</label>
                <select name="vehicleId" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="">Select vehicle...</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.id.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Driver</label>
                <select name="driverId" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="">Select driver...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Number of Codes</label>
                <select name="codeCount" required className="w-full px-3 py-2 bg-surface border border-border rounded text-sm focus:ring-1 focus:ring-brand outline-none">
                  <option value="50">50 slips (1 A4 Page)</option>
                  <option value="100">100 slips (2 A4 Pages)</option>
                  <option value="150">150 slips (3 A4 Pages)</option>
                  <option value="200">200 slips (4 A4 Pages)</option>
                </select>
              </div>

              <button type="submit" className="w-full bg-brand text-brand-foreground py-2 rounded text-sm font-bold hover:bg-brand/95 cursor-pointer">
                Generate Batch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 5. PRINT SLIPS MODAL */}
      {activeModal === "print" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-2xl animate-fade-up relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-1">Print Reward Slips</h3>
            <p className="text-xs text-muted-foreground mb-4">Select generated batches to download print-ready PDFs</p>

            <div className="overflow-y-auto flex-1 mt-2 pr-1 divide-y divide-border">
              {batches.length > 0 ? (
                batches.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-4 text-sm first:pt-0 last:pb-0">
                    <div>
                      <p className="font-mono font-bold text-brand">{b.batchNumber}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.codeCount} codes • {b.vehicleId.toUpperCase()} • {b.printCount || 0}/3 prints
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownloadPDF(b)}
                      disabled={b.printCount >= 3}
                      className={cn(
                        "px-3 py-1.5 rounded text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                        b.printCount >= 3
                          ? "bg-muted text-muted-foreground cursor-not-allowed"
                          : "bg-brand text-white hover:bg-brand/95"
                      )}
                    >
                      <Printer className="size-3.5" />
                      Download PDF
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-muted-foreground py-8">No reward code batches available.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </AppShell>
  );
}
