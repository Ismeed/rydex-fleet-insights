"use client";

import { useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { startShiftAction, endShiftAction, createMaintenanceJobAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/format";
import { 
  ClipboardList, 
  Car, 
  Users, 
  Play, 
  CheckCircle2, 
  Wrench, 
  AlertCircle, 
  UserCheck,
  X
} from "lucide-react";

interface OperationsClientProps {
  user: { name: string; role: string; companyId?: string | null };
  vehicles: any[];
  drivers: any[];
  shifts: any[];
  activeShifts: any[];
  companyName: string;
}

export function OperationsClient({
  user,
  vehicles,
  drivers,
  shifts,
  activeShifts,
  companyName,
}: OperationsClientProps) {
  const [showStartModal, setShowStartModal] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  // Input states for evening collections
  const [odoStart, setOdoStart] = useState<number>(0);
  const [remitExpected, setRemitExpected] = useState<number>(12000);
  const [remitReceived, setRemitReceived] = useState<number>(12000);

  // Filter available items for dispatch
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE");
  const onRoadVehicles = vehicles.filter((v) => v.status === "ON_ROAD");
  const maintenanceVehicles = vehicles.filter((v) => v.status === "MAINTENANCE");

  const driversOnShiftIds = activeShifts.map((s) => s.driverId);
  const availableDrivers = drivers.filter(
    (d) => d.status === "active" && !driversOnShiftIds.includes(d.id)
  );

  // Today's stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayShifts = shifts.filter((s) => new Date(s.startTime) >= todayStart);
  const todayRevenue = todayShifts.reduce((sum, s) => sum + (s.revenue || 0), 0);

  const handleStartShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    
    startTransition(async () => {
      const res = await startShiftAction(null, formData);
      if (res.success) {
        setShowStartModal(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to start shift.");
      }
    });
  };

  const handleEndShift = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    formData.append("shiftId", selectedShift.id);

    startTransition(async () => {
      const res = await endShiftAction(null, formData);
      if (res.success) {
        setShowEndModal(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to end shift.");
      }
    });
  };

  const handleCreateMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createMaintenanceJobAction(null, formData);
      if (res.success) {
        setShowMaintModal(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to log maintenance.");
      }
    });
  };

  return (
    <AppShell
      title="Fleet Operations Console"
      description="Task-focused dashboard for daily morning dispatch and evening collections"
      user={user}
      companyName={companyName}
      actions={
        <div className="flex gap-2">
          <button
            onClick={() => setShowStartModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground text-xs font-semibold rounded-md hover:bg-brand/90 transition-colors cursor-pointer"
          >
            <Play className="size-3.5" /> Dispatch Vehicle (Morning)
          </button>
          <button
            onClick={() => setShowMaintModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-white text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Wrench className="size-3.5 text-slate-500" /> Log Maintenance
          </button>
        </div>
      }
    >
      {/* Overview KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Vehicles Dispatch State"
          value={`${onRoadVehicles.length} / ${vehicles.length} Units`}
          badge={{ label: `${availableVehicles.length} Available`, tone: "brand" }}
        />
        <KpiCard
          label="Today's Remittance Collected"
          value={naira(todayRevenue)}
          badge={{ label: "Live Ledger", tone: "brand" }}
        />
        <KpiCard
          label="Active Shifts Control"
          value={`${activeShifts.length} Active`}
          badge={{ label: "Monitored", tone: "brand" }}
        />
        <KpiCard
          label="Under Maintenance"
          value={`${maintenanceVehicles.length} Vehicles`}
          badge={{ label: "Workshop", tone: "brand" }}
        />
      </section>

      {/* Dispatched vehicles list */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Active dispatches table */}
        <div className="xl:col-span-2 bg-white border border-border rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-base mb-4 flex items-center gap-2">
            <UserCheck className="size-5 text-brand" /> Active Dispatched Drivers (On Road)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                  <th className="px-4 py-2">Vehicle ID</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Start Time</th>
                  <th className="px-4 py-2 font-mono">Start Odometer</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-brand">
                      {s.vehicleId.toUpperCase()}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{s.driver?.name || "Driver"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.startTime).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">
                      {s.startOdometer} KM
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedShift(s);
                          setOdoStart(s.startOdometer);
                          
                          // Look up vehicle HP contract target payment rate
                          const vehicleDetails = vehicles.find((v) => v.id === s.vehicleId);
                          const dailyTarget = vehicleDetails?.contract?.dailyTarget || 12000;
                          setRemitExpected(dailyTarget);
                          setRemitReceived(dailyTarget);
                          
                          setShowEndModal(true);
                        }}
                        className="px-2.5 py-1 bg-brand-soft text-brand-dark hover:bg-brand/20 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Receive Remittance (Evening)
                      </button>
                    </td>
                  </tr>
                ))}
                {activeShifts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      All vehicles are parked. Go to Dispatch Vehicle to start a morning shift.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily dispatch summary */}
        <div className="bg-white border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <ClipboardList className="size-4 text-brand" /> Today's Shift Logs
            </h4>
            <div className="space-y-4">
              {todayShifts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">No shift logs received today yet.</p>
              ) : (
                todayShifts.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 text-xs border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="size-8 rounded-full bg-brand/10 text-brand grid place-items-center shrink-0">
                      <CheckCircle2 className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-semibold text-foreground truncate block">
                          {s.driver?.name || "Driver"} ({s.vehicleId.toUpperCase()})
                        </span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider",
                          s.status === "ENDED" 
                            ? "bg-brand-soft text-brand-dark" 
                            : s.status === "LOW_PERF"
                            ? "bg-warn-soft text-warn"
                            : "bg-red-50 text-red-600"
                        )}>
                          {s.status}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        Odometer: <span className="font-mono text-foreground font-semibold">{s.startOdometer}➔{s.endOdometer || "?"} KM</span>
                      </p>
                      <p className="font-semibold text-brand mt-0.5">
                        Remitted: {naira(s.revenue)} (Shortfall: {naira(s.outstandingBalance)})
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Morning Dispatch Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowStartModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Morning Dispatch</h3>
            <p className="text-xs text-muted-foreground mb-4">Assign an available driver and vehicle to start a new shift.</p>

            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Select Vehicle</label>
                <select
                  name="vehicleId"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-semibold"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id.toUpperCase()} ({v.plateNumber} • {v.vehicleType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Select Driver</label>
                <select
                  name="driverId"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-semibold"
                >
                  <option value="">-- Choose Driver --</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Starting Odometer (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  name="startOdometer"
                  required
                  placeholder="e.g. 12450.5"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                />
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Dispatching..." : "Start Dispatch Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Evening Collection Modal */}
      {showEndModal && selectedShift && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowEndModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Evening Remittance Collection</h3>
            <p className="text-xs text-muted-foreground mb-4">Record vehicle mileage and payment to end the shift.</p>

            <form onSubmit={handleEndShift} className="space-y-4">
              <div className="bg-surface/50 border border-border rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle:</span>
                  <span className="font-semibold text-brand font-mono">{selectedShift.vehicleId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver:</span>
                  <span className="font-semibold text-foreground">{selectedShift.driver?.name || "Driver"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Odometer:</span>
                  <span className="font-semibold text-foreground font-mono">{odoStart} KM</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Closing Odometer (KM)</label>
                <input
                  type="number"
                  step="0.1"
                  name="endOdometer"
                  required
                  placeholder={`Must be greater than ${odoStart}`}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Daily Target Remittance</label>
                  <input
                    type="number"
                    name="amountExpected"
                    value={remitExpected}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setRemitExpected(val);
                    }}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Remittance Received (Revenue)</label>
                  <input
                    type="number"
                    name="revenue"
                    value={remitReceived}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setRemitReceived(val);
                    }}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold text-brand"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center py-2 px-3 bg-brand-soft/20 border border-brand/10 rounded-lg text-xs font-semibold">
                <span className="text-muted-foreground">Remittance Shortfall:</span>
                <span className={cn("font-mono font-bold", remitExpected - remitReceived > 0 ? "text-amber-600" : "text-brand")}>
                  {naira(Math.max(0, remitExpected - remitReceived))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Remarks / Notes</label>
                <input
                  type="text"
                  name="remarks"
                  placeholder="e.g. Completed without issues, partial payment"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Ending Shift..." : "End Shift & Log Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maintenance Job Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowMaintModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Log Vehicle Repair</h3>
            <p className="text-xs text-muted-foreground mb-4">Create a maintenance log and update the vehicle status to repair mode.</p>

            <form onSubmit={handleCreateMaintenance} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Select Vehicle</label>
                <select
                  name="vehicleId"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-semibold"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {vehicles.filter(v => v.status !== "MAINTENANCE").map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id.toUpperCase()} ({v.plateNumber} • {v.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Repair Category</label>
                  <select
                    name="type"
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-semibold"
                  >
                    <option value="GENERAL_SERVICE">General Service</option>
                    <option value="OIL_CHANGE">Oil Change</option>
                    <option value="BRAKE_REPAIR">Brake Repair</option>
                    <option value="TYRE_REPLACEMENT">Tyre Replacement</option>
                    <option value="ENGINE_REPAIR">Engine Repair</option>
                    <option value="CNG_INSPECTION">CNG Inspection</option>
                    <option value="ELECTRICAL_REPAIR">Electrical Repair</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cost (₦)</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    placeholder="Cost in Naira"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Workshop Name</label>
                  <input
                    type="text"
                    name="workshop"
                    required
                    placeholder="Workshop"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Repair Date</label>
                  <input
                    type="date"
                    name="date"
                    required
                    defaultValue={new Date().toISOString().split("T")[0]}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Mechanic Notes</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Replaced worn brake pads, greased calipers"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Logging..." : "Log & Set Maintenance Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
