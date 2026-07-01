"use client";

import { useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { createHirePurchaseContractAction, updateHirePurchaseContractAction } from "@/app/actions";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/format";
import { 
  Handshake, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  X, 
  Edit3 
} from "lucide-react";

interface ContractsClientProps {
  user: { name: string; role: string };
  contracts: any[];
  vehicles: any[];
  drivers: any[];
  companyName: string;
}

export function ContractsClient({
  user,
  contracts,
  vehicles,
  drivers,
  companyName,
}: ContractsClientProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const activeContracts = contracts.filter((c) => c.status === "ACTIVE").length;
  const settledContracts = contracts.filter((c) => c.status === "COMPLETED").length;
  const totalRevenue = contracts.reduce((sum, c) => sum + (c.totalPaid || 0), 0);
  const remainingValue = contracts.reduce((sum, c) => sum + (c.remainingBalance || 0), 0);

  // Filter vehicles without active contracts
  const vehiclesWithActiveContracts = contracts
    .filter((c) => c.status === "ACTIVE")
    .map((c) => c.vehicleId);
  const availableVehiclesForContract = vehicles.filter(
    (v) => !vehiclesWithActiveContracts.includes(v.id)
  );

  // Filter drivers without active contracts
  const driversWithActiveContracts = contracts
    .filter((c) => c.status === "ACTIVE")
    .map((c) => c.driverId);
  const availableDriversForContract = drivers.filter(
    (d) => d.status === "active" && !driversWithActiveContracts.includes(d.id)
  );

  const handleCreateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createHirePurchaseContractAction(null, formData);
      if (res.success) {
        setShowAddModal(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to create contract.");
      }
    });
  };

  const handleUpdateContract = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    formData.append("id", selectedContract.id);

    startTransition(async () => {
      const res = await updateHirePurchaseContractAction(null, formData);
      if (res.success) {
        setShowEditModal(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to update contract.");
      }
    });
  };

  return (
    <AppShell
      title="Hire Purchase Management"
      description="Track driver remittances, progress bars, outstanding balances, and contract completions"
      user={user}
      companyName={companyName}
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground text-xs font-semibold rounded-md hover:bg-brand/90 transition-colors cursor-pointer"
        >
          <Plus className="size-4" /> Create HP Agreement
        </button>
      }
    >
      {/* HP Metrics Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Active Agreements"
          value={activeContracts}
          badge={{ label: "Running Contracts", tone: "brand" }}
        />
        <KpiCard
          label="Settled Contracts"
          value={settledContracts}
          badge={{ label: "Ownership Transferred", tone: "brand" }}
        />
        <KpiCard
          label="Total Amount Received"
          value={naira(totalRevenue)}
          badge={{ label: "Historical Revenue", tone: "brand" }}
        />
        <KpiCard
          label="Outstanding SaaS Value"
          value={naira(remainingValue)}
          badge={{ label: "Receivable Ledger", tone: "brand" }}
        />
      </section>

      {/* Contracts List */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-base mb-4">Hire Purchase Registers</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-4 py-3">Driver & Vehicle</th>
                <th className="px-4 py-3">Remittance Target</th>
                <th className="px-4 py-3">Progression</th>
                <th className="px-4 py-3">Balance Metrics</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contracts.map((c) => {
                const progress = Math.min(100, Math.round((c.totalPaid / c.targetAmount) * 100));
                
                // Calculate expected completion date based on daily target
                const daysRemaining = c.dailyTarget > 0 ? Math.ceil(c.remainingBalance / c.dailyTarget) : 0;
                const expectedCompletion = daysRemaining > 0 
                  ? new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })
                  : "N/A";

                return (
                  <tr key={c.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{c.driver?.name || "Driver"}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          Vehicle: <span className="font-mono font-semibold text-brand">{c.vehicleId.toUpperCase()}</span>
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold">{naira(c.dailyTarget)}/day</span>
                        <span className="text-xs text-muted-foreground mt-0.5">Target: {naira(c.targetAmount)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="max-w-[150px] w-full">
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className="bg-brand h-full rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <div className="flex justify-between items-center mt-1 text-[9px] text-muted-foreground font-mono">
                          <span>{progress}% paid</span>
                          <span className="flex items-center gap-0.5"><Clock className="size-3 text-brand" /> {daysRemaining} days left</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-brand">{naira(c.totalPaid)} Paid</span>
                        <span className="text-xs text-muted-foreground mt-0.5">Rem: {naira(c.remainingBalance)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                          c.status === "ACTIVE"
                            ? "bg-brand-soft text-brand-dark"
                            : c.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700"
                            : c.status === "DEFAULTED"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedContract(c);
                          setShowEditModal(true);
                        }}
                        className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-semibold cursor-pointer"
                      >
                        <Edit3 className="size-3.5" /> Edit
                      </button>
                    </td>
                  </tr>
                );
              })}
              {contracts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No active Hire Purchase contracts recorded. Click Create HP Agreement to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Contract Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Create HP Agreement</h3>
            <p className="text-xs text-muted-foreground mb-4">Set up a Hire Purchase contract for a driver and vehicle.</p>

            <form onSubmit={handleCreateContract} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Select Vehicle</label>
                <select
                  name="vehicleId"
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-semibold"
                >
                  <option value="">-- Choose Vehicle --</option>
                  {availableVehiclesForContract.map((v) => (
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
                  {availableDriversForContract.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contract Target (₦)</label>
                  <input
                    type="number"
                    name="targetAmount"
                    required
                    placeholder="e.g. 4750000"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Daily Remittance (₦)</label>
                  <input
                    type="number"
                    name="dailyTarget"
                    required
                    placeholder="e.g. 12000"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold text-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contract Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-semibold"
                />
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Creating..." : "Launch Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Contract Modal */}
      {showEditModal && selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Modify Agreement Details</h3>
            <p className="text-xs text-muted-foreground mb-4">Edit contract targets, logged paid balances, or suspension status.</p>

            <form onSubmit={handleUpdateContract} className="space-y-4">
              <div className="bg-surface/50 border border-border rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle ID:</span>
                  <span className="font-semibold text-brand font-mono">{selectedContract.vehicleId.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver:</span>
                  <span className="font-semibold text-foreground">{selectedContract.driver?.name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Contract Target (₦)</label>
                  <input
                    type="number"
                    name="targetAmount"
                    defaultValue={selectedContract.targetAmount}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Daily Remittance (₦)</label>
                  <input
                    type="number"
                    name="dailyTarget"
                    defaultValue={selectedContract.dailyTarget}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold text-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Total Paid To Date (₦)</label>
                  <input
                    type="number"
                    name="totalPaid"
                    defaultValue={selectedContract.totalPaid}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Agreement Status</label>
                  <select
                    name="status"
                    defaultValue={selectedContract.status || "ACTIVE"}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED (Ownership Transferred)</option>
                    <option value="DEFAULTED">DEFAULTED</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                  </select>
                </div>
              </div>

              {errorMsg && <p className="text-xs font-semibold text-red-500">{errorMsg}</p>}

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold hover:bg-surface transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "Saving..." : "Save Agreement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
