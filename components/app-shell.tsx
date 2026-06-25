"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  Car,
  Users,
  ClipboardList,
  TrendingUp,
  Gift,
  QrCode,
  UserCircle2,
  FileText,
  Plus,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/shifts", label: "Shifts", icon: ClipboardList },
  { href: "/revenue", label: "Revenue", icon: TrendingUp },
] as const;

const LOYALTY_NAV = [
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/batches", label: "Code Batches", icon: QrCode },
  { href: "/passengers", label: "Passengers", icon: UserCircle2 },
  { href: "/reports", label: "Reports", icon: FileText },
] as const;

export function AppShell({
  title,
  description,
  actions,
  children,
  user = { name: "Aminu Okafor", role: "SUPER_ADMIN" },
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  user?: { name: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = () => {
    // Clear auth cookie and redirect
    document.cookie = "rydex-role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "rydex-phone=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "rydex-name=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    document.cookie = "rydex-id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    router.push("/login");
  };

  const isPassenger = user?.role === "PASSENGER";

  return (
    <div className="flex min-h-screen bg-surface text-foreground font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-sidebar text-sidebar-foreground flex-col fixed top-0 bottom-0 left-0 h-screen shrink-0 border-r border-sidebar-border z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="size-9 bg-brand rounded-md grid place-items-center font-bold text-lg text-brand-foreground">
            R
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold tracking-tight text-lg leading-none">RYDEX</span>
            <span className="text-[10px] uppercase tracking-widest text-white/40 mt-1">Mobility OS</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 mt-2 overflow-y-auto">
          {!isPassenger ? (
            <>
              {PRIMARY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}

              <div className="pt-5 pb-2 px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Passenger Loyalty
              </div>
              {LOYALTY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className="size-4 shrink-0" strokeWidth={2} />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </>
          ) : (
            <>
              <Link
                href="/portal"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === "/portal"
                    ? "bg-white/10 text-white"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Gift className="size-4 shrink-0" strokeWidth={2} />
                <span>Passenger Portal</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/5 space-y-2">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="size-9 rounded-full bg-brand/20 border border-brand/40 grid place-items-center text-[11px] font-bold text-white uppercase shrink-0">
              {user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "US"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium leading-tight truncate text-white">
                {user?.name || "Rydex Operator"}
              </span>
              <span className="text-[10px] text-white/40 truncate">
                {user?.role === "SUPER_ADMIN"
                  ? "Super Admin"
                  : user?.role === "OPERATIONS_OFFICER"
                  ? "Operations Officer"
                  : "Passenger"}
              </span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="size-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden w-full h-16 bg-sidebar text-sidebar-foreground flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-30 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="size-8 bg-brand rounded grid place-items-center font-bold text-base text-brand-foreground">
            R
          </div>
          <span className="font-bold tracking-tight text-base">RYDEX</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1 hover:bg-white/5 rounded text-white/80 hover:text-white"
        >
          {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-sidebar text-sidebar-foreground z-20 flex flex-col p-4 space-y-4">
          <nav className="flex-1 space-y-1">
            {!isPassenger ? (
              <>
                {PRIMARY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <div className="pt-4 pb-2 px-3 text-xs font-bold text-white/30 uppercase tracking-widest">
                  Passenger Loyalty
                </div>
                {LOYALTY_NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:text-white"
                    )}
                  >
                    <item.icon className="size-5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </>
            ) : (
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors",
                  pathname === "/portal" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                )}
              >
                <Gift className="size-5 shrink-0" />
                <span>Passenger Portal</span>
              </Link>
            )}
          </nav>
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="size-9 rounded-full bg-brand/20 border border-brand/40 grid place-items-center text-[11px] font-bold text-white uppercase shrink-0">
                {user?.name ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "US"}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-medium leading-tight truncate text-white">
                  {user?.name || "Rydex Operator"}
                </span>
                <span className="text-[10px] text-white/40 truncate">
                  {user?.role === "SUPER_ADMIN" ? "Super Admin" : "Operations Officer"}
                </span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="size-5 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <header className="hidden lg:flex h-16 border-b border-border bg-white items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="px-3 py-1 bg-surface border border-border rounded-md text-xs font-medium flex items-center gap-2 shrink-0">
              <span className="size-2 bg-brand-accent rounded-full animate-pulse" />
              <span>CityView • Katsina</span>
            </div>
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-semibold truncate">{title}</h1>
              {description && (
                <p className="text-[11px] text-muted-foreground truncate">{description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <span className="text-xs font-medium text-muted-foreground font-mono">
              {new Date().toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}{" "}
              WAT
            </span>
            {actions ?? (
              <Link
                href="/shifts"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-foreground text-sm font-semibold rounded-md hover:bg-brand/90 transition-colors"
              >
                <Plus className="size-4" /> Start Shift
              </Link>
            )}
          </div>
        </header>

        {/* Mobile Page Header (spanned spacing) */}
        <div className="lg:hidden px-4 pt-20 pb-2">
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 space-y-6 lg:space-y-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
