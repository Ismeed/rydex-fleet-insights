"use client";

import { useState, useTransition } from "react";
import { AppShell } from "@/components/app-shell";
import { KpiCard } from "@/components/kpi-card";
import { createCompanyAction, updateCompanyAction } from "@/app/actions";
import { 
  Building, 
  Car, 
  Users, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Edit3, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminClientProps {
  user: { name: string; role: string };
  companies: any[];
  vehicles: any[];
  drivers: any[];
  users: any[];
}

export function AdminClient({
  user,
  companies: initialCompanies,
  vehicles,
  drivers,
  users,
}: AdminClientProps) {
  const [companies, setCompanies] = useState(initialCompanies);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState("");

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
    c.phone.includes(search)
  );

  const activeCompanies = companies.filter((c) => c.status === "ACTIVE").length;

  // Calculate mock subscription revenue based on subscription tiers
  // TRIAL = $0, BASIC = ₦50,000/mo, PREMIUM = ₦150,000/mo, ENTERPRISE = ₦500,000/mo
  const monthlyRevenue = companies.reduce((sum, c) => {
    if (c.status !== "ACTIVE") return sum;
    if (c.subscription === "BASIC") return sum + 50000;
    if (c.subscription === "PREMIUM") return sum + 150000;
    if (c.subscription === "ENTERPRISE") return sum + 500000;
    return sum;
  }, 0);

  const handleAddCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const res = await createCompanyAction(null, formData);
      if (res.success) {
        setShowAddModal(false);
        // Reload page to reflect new company seeding
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to create company.");
      }
    });
  };

  const handleUpdateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    formData.append("id", selectedCompany.id);

    startTransition(async () => {
      const res = await updateCompanyAction(null, formData);
      if (res.success) {
        setShowEditModal(false);
        window.location.reload();
      } else {
        setErrorMsg(res.error || "Failed to update company.");
      }
    });
  };

  return (
    <AppShell
      title="SaaS Administration Dashboard"
      description="MUVA Mobility platform stats & company management"
      user={user}
      companyName="MUVA Platform HQ"
      actions={
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand text-brand-foreground text-sm font-semibold rounded-md hover:bg-brand/90 transition-colors cursor-pointer"
        >
          <Plus className="size-4" /> Add Tenant Company
        </button>
      }
    >
      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Total Companies"
          value={companies.length}
          badge={{ label: `${activeCompanies} Active`, tone: "brand" }}
        />
        <KpiCard
          label="SaaS Monthly Revenue"
          value={`₦${monthlyRevenue.toLocaleString()}`}
          badge={{ label: "Live", tone: "brand" }}
        />
        <KpiCard
          label="Global Vehicles Fleet"
          value={`${vehicles.length} Units`}
          badge={{ label: "Monitored", tone: "brand" }}
        />
        <KpiCard
          label="Platform Status"
          value="Healthy"
          badge={{ label: "99.9% Uptime", tone: "brand" }}
        />
      </section>

      {/* Companies Registry List */}
      <section className="bg-white border border-border rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h3 className="font-bold text-lg text-foreground">Registered Tenant Companies</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Manage sub-accounts, workspace scopes, and subscription states.</p>
          </div>
          
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search companies by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-4 py-3">Company Details</th>
                <th className="px-4 py-3">Fleet Scope</th>
                <th className="px-4 py-3">Subscription</th>
                <th className="px-4 py-3">Country & State</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCompanies.map((c) => {
                const companyVehicles = vehicles.filter((v) => v.companyId === c.id).length;
                const companyDrivers = drivers.filter((d) => d.companyId === c.id).length;

                return (
                  <tr key={c.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-9 bg-brand/10 text-brand font-bold rounded-lg flex items-center justify-center uppercase shrink-0">
                          {c.name.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-foreground truncate block">{c.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{c.email || "No email"} • {c.phone}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-brand bg-brand-soft/45 px-2 py-0.5 rounded-full w-max">
                          {c.fleetType || "General"}
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {companyVehicles} Vehicles • {companyDrivers} Drivers
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono font-bold text-foreground">
                        {c.subscription || "TRIAL"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {c.state || "Katsina"}, {c.country || "Nigeria"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider",
                          c.status === "ACTIVE"
                            ? "bg-brand-soft text-brand-dark"
                            : c.status === "PENDING"
                            ? "bg-warn-soft text-warn"
                            : "bg-red-50 text-red-600"
                        )}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedCompany(c);
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
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No companies matched your search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add Company Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Create Tenant Company</h3>
            <p className="text-xs text-muted-foreground mb-4">Register a new company workspace on the MUVA platform.</p>

            <form onSubmit={handleAddCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Katsina Metro Transport"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="e.g. 08022222222"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="e.g. info@company.com"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Fleet Type</label>
                  <select
                    name="fleetType"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="CNG Tricycles">CNG Tricycles</option>
                    <option value="EV Motorcycles">EV Motorcycles</option>
                    <option value="Mini-Buses">Mini-Buses</option>
                    <option value="General Logistics">General Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Subscription Tier</label>
                  <select
                    name="subscription"
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="TRIAL">Trial Mode</option>
                    <option value="BASIC">Basic OS (₦50k/mo)</option>
                    <option value="PREMIUM">Premium OS (₦150k/mo)</option>
                    <option value="ENTERPRISE">Enterprise (₦500k/mo)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Office Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. No. 5 Bypass Express Road"
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
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
                  {isPending ? "Creating..." : "Create Workspace"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && selectedCompany && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowEditModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2">Edit Workspace Details</h3>
            <p className="text-xs text-muted-foreground mb-4">Modify tenant configuration, subscription status, or suspended roles.</p>

            <form onSubmit={handleUpdateCompany} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Company Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedCompany.name}
                  required
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    defaultValue={selectedCompany.phone}
                    required
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedCompany.email || ""}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Fleet Type</label>
                  <select
                    name="fleetType"
                    defaultValue={selectedCompany.fleetType || "CNG Tricycles"}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="CNG Tricycles">CNG Tricycles</option>
                    <option value="EV Motorcycles">EV Motorcycles</option>
                    <option value="Mini-Buses">Mini-Buses</option>
                    <option value="General Logistics">General Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Subscription Tier</label>
                  <select
                    name="subscription"
                    defaultValue={selectedCompany.subscription || "TRIAL"}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="TRIAL">Trial Mode</option>
                    <option value="BASIC">Basic OS (₦50k/mo)</option>
                    <option value="PREMIUM">Premium OS (₦150k/mo)</option>
                    <option value="ENTERPRISE">Enterprise (₦500k/mo)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Workspace Status</label>
                  <select
                    name="status"
                    defaultValue={selectedCompany.status || "ACTIVE"}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand font-semibold"
                  >
                    <option value="ACTIVE" className="text-brand">ACTIVE (Verified)</option>
                    <option value="PENDING" className="text-warn">PENDING (Review)</option>
                    <option value="SUSPENDED" className="text-red-500">SUSPENDED (Locked)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Office Address</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={selectedCompany.address || ""}
                    className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-brand"
                  />
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
                  {isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
