"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loginAction } from "@/app/actions";
import { useTransition } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Next.js 15 useActionState hook
  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await loginAction(prevState, formData);
      if (res.success) {
        startTransition(() => {
          if (res.role === "PASSENGER") {
            router.push("/portal");
          } else {
            router.push("/");
          }
        });
      }
      return res;
    },
    null
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Visual Side Pane */}
      <div className="hidden md:flex md:w-1/2 bg-sidebar text-sidebar-foreground p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-brand to-transparent" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="size-10 bg-brand rounded-lg grid place-items-center font-bold text-xl text-brand-foreground">
            R
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-xl leading-none">RYDEX</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Mobility OS</span>
          </div>
        </div>

        <div className="space-y-6 relative z-10 max-w-lg">
          <span className="px-3 py-1 bg-brand/20 border border-brand/40 text-brand-accent text-xs font-semibold rounded-full uppercase tracking-wider">
            CityView CNG Partnership
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Smart Mobility & Fleet Operations Platform
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Transparent revenue tracking, live shift operations, CNG utilization, and passenger reward analytics for Northern Nigerian transit networks.
          </p>
        </div>

        <div className="text-xs text-white/40 relative z-10">
          © 2026 Rydex Mobility. Katsina State Operations.
        </div>
      </div>

      {/* Form Pane */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-up">
          <div className="space-y-3">
            <div className="flex md:hidden items-center gap-3">
              <div className="size-9 bg-brand rounded-md grid place-items-center font-bold text-lg text-brand-foreground">
                R
              </div>
              <span className="font-bold tracking-tight text-lg leading-none">RYDEX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Sign In
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access the Rydex workspace.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-3.5 bg-danger-soft text-danger border border-danger/15 rounded-lg text-xs font-semibold">
                {state.error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="e.g. 08012345678"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 focus:ring-2 focus:ring-brand/35 transition-all disabled:opacity-50"
            >
              {isPending ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs sm:text-sm text-muted-foreground">
            Passenger without an account?{" "}
            <Link href="/signup" className="text-brand font-semibold hover:underline">
              Register Here
            </Link>
          </div>

          {/* Quick Demo Assist */}
          <div className="p-4 bg-surface border border-border rounded-xl space-y-2.5">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Demo Credentials
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2 rounded border border-border font-mono">
                <p className="font-bold text-brand">Admin Account</p>
                <p>Phone: 08012345678</p>
                <p>Pass: password</p>
              </div>
              <div className="bg-white p-2 rounded border border-border font-mono">
                <p className="font-bold text-brand">Passenger</p>
                <p>Phone: 08033333333</p>
                <p>Pass: password</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
