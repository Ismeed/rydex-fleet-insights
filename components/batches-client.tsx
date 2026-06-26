"use client";

import { useActionState, useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { generateBatchAction, recordBatchPrintAction, deleteBatchAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { toast } from "sonner";
import { QrCode, Printer, Eye, Trash2, X } from "lucide-react";
import { generateRewardSlipsPDF } from "@/lib/pdf-generator";

interface BatchesClientProps {
  user: { name: string; role: string };
  batches: any[];
  vehicles: any[];
  drivers: any[];
  kpis: {
    generated: number;
    assigned: number;
    redeemed: number;
    rate: number;
  };
}

export function BatchesClient({
  user,
  batches,
  vehicles,
  drivers,
  kpis,
}: BatchesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedBatchForCodes, setSelectedBatchForCodes] = useState<any | null>(null);

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await generateBatchAction(prevState, formData);
      if (res.success) {
        toast.success("Reward code batch generated successfully!");
        router.refresh();
      } else {
        toast.error(res.error || "Failed to generate batch");
      }
      return res;
    },
    null
  );

  const handleDownloadPDF = async (batch: any) => {
    if (!batch.codes || batch.codes.length === 0) {
      toast.error("No reward codes available in this batch.");
      return;
    }
    
    // Filter out placeholders
    const validCodes = batch.codes
      .map((c: any) => c.code)
      .filter((code: string) => code && !code.includes("XXXXXX"));

    if (validCodes.length === 0) {
      toast.error("No valid reward codes found in this batch.");
      return;
    }

    const currentCount = batch.printCount || 0;
    if (currentCount >= 3) {
      toast.error("Maximum print limit (3) reached for this batch.");
      return;
    }

    const dateString = new Date().toISOString().split('T')[0];
    const filename = `MUVA_Reward_Codes_${batch.batchNumber}_${dateString}.pdf`;

    try {
      generateRewardSlipsPDF(validCodes, filename);
      toast.success(`PDF generated: ${filename}`);

      // Record print action in database
      const res = await recordBatchPrintAction(batch.id, user.name);
      if (res.success) {
        router.refresh();
      } else {
        toast.error(res.error || "Failed to log print action.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document.");
    }
  };

  const handleDeleteBatch = async (batchId: string) => {
    if (!confirm("Are you sure you want to delete this batch and all its codes? This cannot be undone.")) {
      return;
    }

    const res = await deleteBatchAction(batchId);
    if (res.success) {
      toast.success("Batch deleted successfully.");
      router.refresh();
    } else {
      toast.error(res.error || "Failed to delete batch.");
    }
  };

  return (
    <AppShell
      title="Reward Code Batches"
      description="Generate non-sequential, single-use codes for passenger distribution"
      user={user}
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Codes Generated" value={kpis.generated.toLocaleString()} />
        <KpiCard label="Codes Assigned" value={kpis.assigned.toLocaleString()} delayMs={60} />
        <KpiCard label="Codes Redeemed" value={kpis.redeemed.toLocaleString()} delayMs={120} />
        <KpiCard
          label="Redemption Rate"
          value={`${kpis.rate}%`}
          badge={{ label: kpis.rate >= 50 ? "Healthy" : "Low", tone: kpis.rate >= 50 ? "brand" : "warn" }}
          delayMs={180}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batches Table */}
        <div className="lg:col-span-2 bg-white border border-border rounded-xl shadow-sm overflow-hidden animate-fade-up">
          <div className="p-5 border-b border-border">
            <h3 className="font-bold text-base">Generated Batches</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Track compliance and redemption status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                  <th className="px-4 py-2">Batch ID</th>
                  <th className="px-4 py-2">Date Created</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2">Printed Status</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs sm:text-sm">
                {batches.length > 0 ? (
                  batches.map((b) => {
                    const printCount = b.printCount || 0;
                    const dateCreated = new Date(b.dateGenerated).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    });

                    return (
                      <tr key={b.id} className="hover:bg-surface/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-brand">
                          <div className="flex flex-col">
                            <span>{b.batchNumber}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {b.vehicleId?.toUpperCase()} • {b.driver?.name || "Driver"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">{dateCreated}</td>
                        <td className="px-4 py-3 font-mono">{b.codeCount} codes</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            printCount === 0 
                              ? "bg-slate-100 text-slate-700" 
                              : printCount >= 3 
                              ? "bg-danger-soft text-danger" 
                              : "bg-brand/10 text-brand"
                          }`}>
                            {printCount} / 3 Prints
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleDownloadPDF(b)}
                              disabled={printCount >= 3}
                              title={printCount >= 3 ? "Max prints reached" : "Download PDF"}
                              className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded transition-colors active:scale-95 cursor-pointer ${
                                printCount >= 3 
                                  ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                  : "bg-brand/10 hover:bg-brand text-brand hover:text-white"
                              }`}
                            >
                              <Printer className="size-3.5" />
                              <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button
                              onClick={() => setSelectedBatchForCodes(b)}
                              title="View Codes & History"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white rounded transition-colors active:scale-95 cursor-pointer"
                            >
                              <Eye className="size-3.5" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBatch(b.id)}
                              title="Delete Batch"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-danger-soft hover:bg-danger text-danger hover:text-white rounded transition-colors active:scale-95 cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-xs text-muted-foreground">
                      No code batches generated yet. Use the form to generate one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generate Batch Form */}
        <div
          className="bg-white border border-border rounded-xl shadow-sm p-5 sm:p-6 animate-fade-up"
          style={{ animationDelay: "120ms" }}
        >
          <h3 className="font-bold text-base mb-1">Generate Code Batch</h3>
          <p className="text-xs text-muted-foreground mb-5">
            Operations officer creates code print sets for drivers
          </p>

          <form action={formAction} className="space-y-4">
            {state?.error && (
              <div className="p-3 bg-danger-soft text-danger border border-danger/15 rounded text-xs font-semibold">
                {state.error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="vehicleId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Assign Vehicle
              </label>
              <select
                id="vehicleId"
                name="vehicleId"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="">Select vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.id.toUpperCase()} ({v.plateNumber})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="driverId" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Assign Driver
              </label>
              <select
                id="driverId"
                name="driverId"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="">Select driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="codeCount" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Batch Size (Codes count)
              </label>
              <select
                id="codeCount"
                name="codeCount"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand outline-none"
              >
                <option value="50">50 Codes (1 Page)</option>
                <option value="100">100 Codes (2 Pages)</option>
                <option value="150">150 Codes (3 Pages)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <QrCode className="size-4" /> Generate Print Batch
            </button>
          </form>
        </div>
      </section>

      {/* View Codes & Print History Modal */}
      {selectedBatchForCodes && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-40">
          <div className="bg-white border border-border rounded-xl p-5 sm:p-6 w-full max-w-2xl max-h-[85vh] overflow-y-auto animate-fade-up relative">
            <button
              onClick={() => setSelectedBatchForCodes(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <h3 className="font-bold text-lg mb-1">Batch Detail: {selectedBatchForCodes.batchNumber}</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Assigned Vehicle: <span className="font-mono font-semibold">{selectedBatchForCodes.vehicleId?.toUpperCase()}</span> | 
              Driver: <span className="font-semibold">{selectedBatchForCodes.driver?.name}</span>
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Code List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Generated Codes ({selectedBatchForCodes.codes?.length || 0})</h4>
                <div className="border border-border rounded-lg bg-surface max-h-60 overflow-y-auto divide-y divide-border">
                  {selectedBatchForCodes.codes && selectedBatchForCodes.codes.length > 0 ? (
                    selectedBatchForCodes.codes.map((c: any) => (
                      <div key={c.id} className="p-2.5 flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold">{c.code}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === "UNUSED" 
                            ? "bg-brand/10 text-brand" 
                            : "bg-gray-100 text-gray-500"
                        }`}>
                          {c.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">No codes found in this batch.</div>
                  )}
                </div>
              </div>

              {/* Right Column: Print History Log */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Print Log History</h4>
                <div className="border border-border rounded-lg bg-surface p-4 max-h-60 overflow-y-auto space-y-3">
                  {(() => {
                    let logs: any[] = [];
                    try {
                      logs = JSON.parse(selectedBatchForCodes.printHistory || "[]");
                    } catch (e) {
                      logs = [];
                    }

                    if (logs.length === 0) {
                      return (
                        <p className="text-xs text-muted-foreground text-center py-8">
                          No print logs. This batch has not been downloaded/printed yet.
                        </p>
                      );
                    }

                    return logs.map((log: any, idx: number) => (
                      <div key={idx} className="text-xs border-b border-border/50 pb-2 last:border-0 last:pb-0">
                        <div className="flex items-center justify-between font-bold text-brand">
                          <span>Print #{log.printNumber}</span>
                          <span className="text-[10px] text-muted-foreground font-normal">{log.date} {log.time}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Initiated by: <span className="font-semibold text-foreground">{log.user}</span>
                        </p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
