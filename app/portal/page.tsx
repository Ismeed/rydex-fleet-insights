import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-helper";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LegacyPassengerPortalPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white border border-border rounded-xl p-8 shadow-lg text-center space-y-6 animate-scale-up">
        <div className="size-16 bg-brand-soft border border-brand/20 text-brand rounded-full flex items-center justify-center mx-auto">
          <ShieldAlert className="size-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="font-bold text-xl text-foreground">Legacy Passenger Portal</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The MUVA Mobility commuter loyalty program has been successfully migrated to the new <strong>B2B Fleet Operations & Hire Purchase OS</strong>.
          </p>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-muted-foreground text-left leading-relaxed">
          <strong>Notice for Commuters:</strong> This access point is now reserved for fleet owners, vehicle operators, and administrative staff. If you are a driver under contract, please contact your operations office to verify your account credentials.
        </div>

        <div className="pt-2">
          <Link
            href="/login"
            className="inline-block w-full py-2 bg-brand text-brand-foreground rounded-lg text-xs font-bold hover:bg-brand/90 transition-colors"
          >
            Back to Login Console
          </Link>
        </div>
      </div>
    </div>
  );
}
