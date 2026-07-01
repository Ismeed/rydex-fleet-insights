"use client";

import { useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { createBulkMaintenanceJobAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/format";
import { 
  Wrench, 
  Plus, 
  CheckCircle, 
  X, 
  AlertCircle, 
  Building, 
  Calendar 
} from "lucide-react";

interface MaintenanceClientProps {
  user: { name: string; role: string };
  maintenances: any[];
  vehicles: any[];
  companyName: string;
}

export function MaintenanceClient({
  user,
  maintenances,
  vehicles,
  companyName,
}: MaintenanceClientProps) {
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const totalCost = maintenances.reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalJobs = maintenances.length;
  const inShopCount = vehicles.filter((v) => v.status === "MAINTENANCE").length;
  const avgCost = totalJobs > 0 ? Math.round(totalCost / totalJobs) : 0;

  const handleToggleVehicle = (id: string) => {
    setSelectedVehicles((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    );
  };

  const handleSelectAllVehicles = () => {
    if (selectedVehicles.length === vehicles.length) {
      setSelectedVehicles([]);
    } else {
      setSelectedVehicles(vehicles.map((v) => v.id));
    }
  };

  const handleCreateBulkMaintenance = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");

    if (selectedVehicles.length === 0) {
      setErrorMsg("Please select at least one vehicle.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.append("vehicleIds", selectedVehicles.join(","));

    startTransition(async () => {
      const res = await createBulkMaintenanceJobAction(null, formData);
      if (res.success) {
        setShowBulkModal(false);
        setSelectedVehicles([]);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to log bulk maintenance.");
      }
    });
  };

  return (
    <AppShell
      title="Maintenance & Repairs Management"
      description="Track repair expenses, workshops, and bulk-dispatch vehicles to maintenance"
      user={user}
      companyName={companyName}
      actions={
        <button
          onClick={() => setShowBulkModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground text-xs font-semibold rounded-md hover:bg-brand/90 transition-colors cursor-pointer"
        >
          <Plus className="size-4" /> Log Bulk Maintenance
        </button>
      }
    >
      {/* Maintenance KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Maintenance Cost"
          value={naira(totalCost)}
          badge={{ label: "Historical Outflow", tone: "brand" }}
        />
        <KpiCard
          label="Repairs Completed"
          value={`${totalJobs} Jobs`}
          badge={{ label: "Monitored Logs", tone: "brand" }}
        />
        <KpiCard
          label="Currently In Workshop"
          value={`${inShopCount} Vehicles`}
          badge={{ label: "Status: MAINTENANCE", tone: "brand" }}
        />
        <KpiCard
          label="Average Repair Cost"
          value={naira(avgCost)}
          badge={{ label: "Per Job Outlay", tone: "brand" }}
        />
      </section>

      {/* Maintenance Logs List */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-base mb-4">Historical Maintenance Ledger</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Repair Type</th>
                <th className="px-4 py-3">Workshop Details</th>
                <th className="px-4 py-3">Expense</th>
                <th className="px-4 py-3">Repair Date</th>
                <th className="px-4 py-3">Mechanic Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {maintenances.map((m) => (
                <tr key={m.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-semibold text-brand">
                    {m.vehicleId.toUpperCase()}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">
                    {m.type.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="size-3.5 text-slate-400" />
                      <span>{m.workshop}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-amber-600">
                    {naira(m.cost)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <div className="flex items-center gap-1 font-mono text-xs">
                      <Calendar className="size-3.5 text-slate-400" />
                      <span>{new Date(m.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground italic text-xs max-w-xs truncate">
                    {m.notes || "No extra logs recorded."}
                  </td>
                </tr>
              ))}
              {maintenances.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No repair logs found for your workspace fleet. Click Log Bulk Maintenance to register logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bulk Maintenance Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowBulkModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Log Bulk Maintenance</h3>
            <p className="text-xs text-muted-foreground mb-4">Select multiple vehicles and register an identical repair log for all of them.</p>

            <form onSubmit={handleCreateBulkMaintenance} className="space-y-4">
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
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cost per Vehicle (₦)</label>
                  <input
                    type="number"
                    name="cost"
                    required
                    placeholder="Cost per vehicle"
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
                    placeholder="e.g. Total Care Center"
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
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Select Vehicles to Include</label>
                <div className="border border-border rounded-lg bg-surface/30 p-3 max-h-40 overflow-y-auto space-y-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-border">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={selectedVehicles.length === vehicles.length && vehicles.length > 0}
                      onChange={handleSelectAllVehicles}
                      className="size-4 rounded text-brand focus:ring-brand cursor-pointer"
                    />
                    <label htmlFor="select-all" className="text-xs font-bold text-muted-foreground uppercase cursor-pointer select-none">
                      Select All Vehicles ({vehicles.length})
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {vehicles.map((v) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`v-chk-${v.id}`}
                          checked={selectedVehicles.includes(v.id)}
                          onChange={() => handleToggleVehicle(v.id)}
                          className="size-3.5 rounded text-brand focus:ring-brand cursor-pointer"
                        />
                        <label htmlFor={`v-chk-${v.id}`} className="text-xs font-mono font-semibold text-foreground truncate cursor-pointer select-none">
                          {v.id.toUpperCase()}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold mt-1 px-1">
                  <span>Selected: {selectedVehicles.length} Vehicles</span>
                  {selectedVehicles.length > 0 && (
                    <span>Total cost: {naira(selectedVehicles.length * (parseFloat((document.getElementsByName("cost")[0] as HTMLInputElement)?.value) || 0))}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Mechanic Notes</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="e.g. Bulk engine checkup for all CNG trikes"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Logging Bulk Jobs..." : "Log Maintenance & Set Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
