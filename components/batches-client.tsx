"use client";

import { useActionState, useTransition } from "react";
import { generateBatchAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { toast } from "sonner";
import { QrCode, Printer } from "lucide-react";
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
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await generateBatchAction(prevState, formData);
      if (res.success) {
        toast.success("Reward code batch generated successfully!");
      } else {
        toast.error(res.error || "Failed to generate batch");
      }
      return res;
    },
    null
  );

  const handlePrint = (codes: any[]) => {
    if (!codes || codes.length === 0) {
      toast.error("No reward codes available in this batch.");
      return;
    }
    
    // Filter out placeholders
    const validCodes = codes
      .map(c => c.code)
      .filter(code => code && !code.includes("XXXXXX"));

    if (validCodes.length === 0) {
      toast.error("No valid reward codes found in this batch.");
      return;
    }

    const dateString = new Date().toISOString().split('T')[0];
    const filename = `MUVA_Reward_Codes_${dateString}.pdf`;

    try {
      generateRewardSlipsPDF(validCodes, filename);
      toast.success(`PDF generated successfully: ${filename}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF document.");
    }
  };

  return (
    <AppShell
      title="Reward Code Batches"
      description="Generate non-sequential, single-use codes for passenger distribution"
      user={user}
    >

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                  <th className="px-4 py-2">Batch Number</th>
                  <th className="px-4 py-2">Vehicle</th>
                  <th className="px-4 py-2">Driver</th>
                  <th className="px-4 py-2">Size</th>
                  <th className="px-4 py-2 text-right">Redemption</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {batches.length > 0 ? (
                  batches.map((b) => {
                    const redeemedCount = b.codes?.filter((c: any) => c.status === "REDEEMED").length || 0;
                    const percent = b.codeCount > 0 ? Math.round((redeemedCount / b.codeCount) * 100) : 0;
                    return (
                      <tr key={b.id} className="hover:bg-surface/30 transition-colors">
                        <td className="px-4 py-3 font-mono font-semibold text-brand">{b.batchNumber}</td>
                        <td className="px-4 py-3 font-mono text-muted-foreground">{b.vehicleId?.toUpperCase()}</td>
                        <td className="px-4 py-3">{b.driver?.name || "Driver"}</td>
                        <td className="px-4 py-3 font-mono">{b.codeCount} codes</td>
                        <td className="px-4 py-3 text-right font-mono font-bold">
                          {redeemedCount} / {b.codeCount} ({percent}%)
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handlePrint(b.codes)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-brand/10 hover:bg-brand text-brand hover:text-white rounded transition-colors active:scale-95"
                          >
                            <Printer className="size-3" /> Print Slips
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-4 text-center text-xs text-muted-foreground">
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
                <option value="100">100 Codes</option>
                <option value="300">300 Codes</option>
                <option value="500">500 Codes</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 transition-colors flex items-center justify-center gap-1.5"
            >
              <QrCode className="size-4" /> Generate Print Batch
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
