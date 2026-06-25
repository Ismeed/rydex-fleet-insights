"use client";

import { useActionState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signupAction } from "@/app/actions";

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState(
    async (prevState: any, formData: FormData) => {
      const res = await signupAction(prevState, formData);
      if (res.success) {
        startTransition(() => {
          router.push("/portal");
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
            Passenger Loyalty
          </span>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Earn rewards while riding.
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Register your Rydex passenger account, collect reward codes on your commutes, and redeem them for free airtime or mobile data packages.
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
              Register Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign up as a Rydex passenger to begin earning points.
            </p>
          </div>

          <form action={formAction} className="space-y-5">
            {state?.error && (
              <div className="p-3.5 bg-danger-soft text-danger border border-danger/15 rounded-lg text-xs font-semibold">
                {state.error}
              </div>
            )}

            <div className="space-y-1">
              <label htmlFor="name" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Ibrahim Bakare"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="phone" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="text"
                placeholder="e.g. 08033333333"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm font-mono focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                required
                className="w-full px-3 py-2 bg-surface border border-border rounded-md text-sm focus:ring-1 focus:ring-brand focus:border-brand outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full bg-brand text-brand-foreground py-2.5 rounded-md text-sm font-bold hover:bg-brand/90 focus:ring-2 focus:ring-brand/35 transition-all disabled:opacity-50"
            >
              {isPending ? "Registering..." : "Register"}
            </button>
          </form>

          <div className="pt-2 text-center text-xs sm:text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-brand font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
