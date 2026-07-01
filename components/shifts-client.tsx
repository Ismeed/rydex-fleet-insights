"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startShiftAction, endShiftAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { FilterBar } from "@/components/filter-bar";
import { compactNaira, naira } from "@/lib/format";
import { toast } from "sonner";
import { Plus, X, ClipboardCheck, Clock } from "lucide-react";

interface ShiftsClientProps {
  user: { name: string; role: string };
  activeShifts: any[];
  vehicles: any[];
  drivers: any[];
  completedShifts: any[];
  period: string;
  companyName: string;
}

export function ShiftsClient({
  user,
  activeShifts,
  vehicles,
  drivers,
  completedShifts,
  period,
  companyName,
}: ShiftsClientProps) {
  const router = useRouter();
  const [endShiftId, setEndShiftId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [startState, startFormAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await startShiftAction(prevState, formData);
      if (res.success) {
        toast.success("Morning shift started successfully!");
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
        toast.success("Shift ended and HP progress updated!");
        setEndShiftId(null);
        router.refresh();
      } else {
        toast.error(res.error || "Failed to end shift");
      }
      return res;
    },
    null
  );

  const selectedShift = activeShifts.find((s) => s.id === endShiftId);

  // Find dispatched vehicles and drivers
  const activeVehicleIds = activeShifts.map((s) => s.vehicleId.toLowerCase());
  const activeDriverIds = activeShifts.map((s) => s.driverId);

  return (
    <AppShell
      title="Daily Shift Control"
      description="Morning vehicle dispatches and evening remittance receipts control deck"
      user={user}
      companyName={companyName}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Shifts Queue */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-fade-up">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-base">Active Vehicles (On Road)</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              End an active shift to log closing odometer readings and credit driver remittances.
            </p>
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
                    <p className="text-xs text-muted-foreground truncate">
                      {s.driver?.name || "Driver"} • started at{" "}
                      {new Date(s.startTime).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      (Odo: {s.startOdometer} KM)
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <button
                      onClick={() => setEndShiftId(s.id)}
                      className="px-3.5 py-1.5 bg-brand-soft hover:bg-brand/20 text-brand-dark text-xs font-bold rounded transition-colors"
                    >
                      Receive Remittance
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                All vehicles are parked. Go to morning dispatch form to start a shift.
              </div>
            )}
          </div>
        </div>

        {/* Start New Shift Form */}
        <div
          className="bg-white border border-border rounded-xl shadow-sm p-5 sm:p-6 animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <h3 className="font-bold text-base mb-1">Morning Dispatch</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Assign driver, vehicle, and log starting odometer readings.
          </p>

          <form action={startFormAction} className="space-y-4">
            {startState?.error && (
              <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                {startState.error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="vehicleId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Vehicle
              </label>
              <select
                id="vehicleId"
                name="vehicleId"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="">Select vehicle...</option>
                {vehicles
                  .filter((v) => v.status === "AVAILABLE" && !activeVehicleIds.includes(v.id.toLowerCase()))
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.id.toUpperCase()} ({v.plateNumber})
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="driverId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Driver
              </label>
              <select
                id="driverId"
                name="driverId"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="">Select driver...</option>
                {drivers
                  .filter((d) => d.status === "active" && !activeDriverIds.includes(d.id))
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="startOdometer" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Starting Odometer (KM)
              </label>
              <input
                id="startOdometer"
                name="startOdometer"
                type="number"
                step="0.1"
                placeholder="e.g. 12450.2"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="size-4" /> Dispatch Shift
            </button>
          </form>
        </div>
      </div>

      {/* Historical Completed Shifts Section */}
      <div className="mt-8 bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-fade-up" style={{ animationDelay: "180ms" }}>
        <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">Completed Shifts History</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Historical ledger of driver dispatches and collections
            </p>
          </div>
        </div>

        <div className="p-5 bg-surface/30 border-b border-border">
          <FilterBar />
        </div>

        <div className="overflow-x-auto">
          {completedShifts.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-b border-border">
                  <th className="p-4">Date</th>
                  <th className="p-4">Vehicle</th>
                  <th className="p-4">Driver</th>
                  <th className="p-4">Hours Worked</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Expected (₦)</th>
                  <th className="p-4">Collected (₦)</th>
                  <th className="p-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {completedShifts.map((s) => (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="p-4 font-medium text-muted-foreground">
                      {new Date(s.startTime).toLocaleDateString("en-NG", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="p-4 font-mono font-bold text-brand">{s.vehicleId.toUpperCase()}</td>
                    <td className="p-4">{s.driver?.name || "Driver"}</td>
                    <td className="p-4 text-muted-foreground">
                      {s.hoursWorked !== null ? `${s.hoursWorked}h ${s.minutesWorked}m` : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">
                      {s.distanceCovered !== null ? `${s.distanceCovered} KM` : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground font-mono">
                      {naira(s.amountExpected || 0)}
                    </td>
                    <td className="p-4 font-semibold text-foreground font-mono">
                      {naira(s.amountReceived || 0)}
                    </td>
                    <td className="p-4 text-right">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          s.status === "FLAGGED"
                            ? "bg-danger-soft text-danger border-danger/10"
                            : s.status === "LOW_PERF"
                            ? "bg-warning-soft text-warning border-warning/10"
                            : "bg-brand/10 text-brand border-brand/10"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-sm text-muted-foreground">
              No completed shifts found in the selected period.
            </div>
          )}
        </div>
      </div>

      {/* End Shift Dialog / Overlay */}
      {endShiftId && selectedShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-md animate-fade-up relative">
            <button
              onClick={() => setEndShiftId(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-bold text-lg mb-1">Evening Collections</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Compile vehicle stats for <span className="font-mono font-bold text-brand">{selectedShift.vehicleId.toUpperCase()}</span> operated by {selectedShift.driver?.name}
            </p>

            <form action={endFormAction} className="space-y-4">
              <input type="hidden" name="shiftId" value={selectedShift.id} />

              {endState?.error && (
                <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                  {endState.error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Starting Odometer
                </label>
                <div className="px-3 py-2 bg-surface border border-border rounded text-sm font-mono text-muted-foreground">
                  {selectedShift.startOdometer} KM
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="endOdometer" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Ending Odometer (KM)
                </label>
                <input
                  id="endOdometer"
                  name="endOdometer"
                  type="number"
                  step="0.1"
                  min={selectedShift.startOdometer}
                  placeholder={`Must be > ${selectedShift.startOdometer}`}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="amountExpected" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Expected Remittance (₦)
                  </label>
                  <input
                    id="amountExpected"
                    name="amountExpected"
                    type="number"
                    defaultValue={selectedShift.driver?.avgPerDay || 12000}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="revenue" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Collected (₦)
                  </label>
                  <input
                    id="revenue"
                    name="revenue"
                    type="number"
                    placeholder="e.g. 12000"
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="remarks" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Remarks / Notes
                </label>
                <input
                  id="remarks"
                  name="remarks"
                  type="text"
                  placeholder="e.g. Returned clean, fuel full"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ClipboardCheck className="size-4" /> End Shift & Settle Remittance
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
