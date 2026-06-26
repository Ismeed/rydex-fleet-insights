"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { naira, compactNaira } from "@/lib/format";
import { 
  createOwnerAction, 
  updateOwnerAction, 
  suspendOwnerAction,
  unsuspendOwnerAction
} from "@/app/actions";

interface Vehicle {
  id: string;
  vehicleNumber: string;
  plateNumber: string;
  status: string;
  totalRevenue?: number;
  totalDistance?: number;
}

interface Owner {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  vehiclesCount: number;
  totalRevenue: number;
  vehicles: Vehicle[];
}

interface OwnersRegistryProps {
  initialOwners: Owner[];
}

const STATUS_TONE: Record<string, string> = {
  active: "bg-brand/10 text-brand border border-brand/20",
  suspended: "bg-red-50 text-red-700 border border-red-200",
};

export function OwnersRegistry({ initialOwners }: OwnersRegistryProps) {
  const [owners, setOwners] = useState<Owner[]>(initialOwners);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedOwner, setSelectedOwner] = useState<Owner | null>(null);

  // Form State
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    password: "",
    status: "active",
  });

  const handleOpenAddModal = () => {
    setErrorMsg("");
    setFormData({
      id: "",
      name: "",
      phone: "",
      email: "",
      password: "Rydex123", // default password
      status: "active",
    });
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (owner: Owner) => {
    setErrorMsg("");
    setSelectedOwner(owner);
    setFormData({
      id: owner.id,
      name: owner.name,
      phone: owner.phone,
      email: owner.email || "",
      password: "", // not editing password here
      status: owner.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (owner: Owner) => {
    setSelectedOwner(owner);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOwner(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const fd = new FormData();
    Object.entries(formData).forEach(([key, val]) => {
      fd.append(key, val);
    });

    startTransition(async () => {
      let res;
      if (modalMode === "add") {
        res = await createOwnerAction(null, fd);
      } else {
        res = await updateOwnerAction(null, fd);
      }

      if (res.success) {
        if (modalMode === "add") {
          const newO: Owner = {
            id: `u-${Date.now()}`,
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            status: formData.status,
            vehiclesCount: 0,
            totalRevenue: 0,
            vehicles: [],
          };
          setOwners([newO, ...owners]);
        } else {
          setOwners(prev => prev.map(o => {
            if (o.id === formData.id) {
              return {
                ...o,
                name: formData.name,
                phone: formData.phone,
                email: formData.email || null,
                status: formData.status,
              };
            }
            return o;
          }));
        }
        handleCloseModal();
      } else {
        setErrorMsg(res.error || "An error occurred. Please try again.");
      }
    });
  };

  const handleToggleSuspension = async (owner: Owner) => {
    const isSuspended = owner.status === "suspended";
    const confirmMsg = isSuspended 
      ? `Are you sure you want to unsuspend ${owner.name}?`
      : `Are you sure you want to suspend ${owner.name}? Suspended owners will lose all portal access immediately.`;

    if (!confirm(confirmMsg)) return;

    let res;
    if (isSuspended) {
      res = await unsuspendOwnerAction(owner.id);
    } else {
      res = await suspendOwnerAction(owner.id);
    }

    if (res.success) {
      setOwners(prev => prev.map(o => 
        o.id === owner.id 
          ? { ...o, status: isSuspended ? "active" : "suspended" } 
          : o
      ));
    } else {
      alert(res.error || "Failed to update owner status.");
    }
  };

  // Filter Owners
  const filteredOwners = owners.filter((o) => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.phone.includes(searchTerm);

    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Registry Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 border border-border rounded-xl shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
              <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by owner name, email, phone..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Filter dropdown */}
          <select
            className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0 active:scale-95"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Owner
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Owner Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3 text-center">Vehicles owned</th>
                <th className="px-6 py-3">Total Revenue</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredOwners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground">
                    No owners registered under this filter.
                  </td>
                </tr>
              ) : (
                filteredOwners.map((o) => (
                  <tr key={o.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {o.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {o.email || "—"}
                    </td>
                    <td className="px-6 py-4 font-mono text-muted-foreground">
                      {o.phone}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold">
                      {o.vehiclesCount}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-brand">
                      {naira(o.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("px-2.5 py-1 text-[9px] font-bold rounded-full uppercase tracking-wider", STATUS_TONE[o.status])}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenViewModal(o)}
                          className="p-1.5 hover:bg-surface rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="View Performance"
                        >
                          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(o)}
                          className="p-1.5 hover:bg-surface rounded text-muted-foreground hover:text-brand transition-colors"
                          title="Edit Profile"
                        >
                          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleSuspension(o)}
                          className={cn(
                            "p-1.5 hover:bg-surface rounded transition-colors",
                            o.status === "suspended" 
                              ? "text-brand hover:text-brand-dark" 
                              : "text-muted-foreground hover:text-red-600"
                          )}
                          title={o.status === "suspended" ? "Unsuspend Owner" : "Suspend Owner"}
                        >
                          {o.status === "suspended" ? (
                            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : (
                            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Backdrop */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-up border border-border">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <h3 className="font-bold text-lg">
                {modalMode === "add" && "Register New Investor"}
                {modalMode === "edit" && `Edit Investor Profile: ${selectedOwner?.name}`}
                {modalMode === "view" && `Investor Performance: ${selectedOwner?.name}`}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-800"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* View Performance Mode */}
            {modalMode === "view" && selectedOwner ? (
              <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                {/* Financial Summary card */}
                <div className="grid grid-cols-3 gap-4 bg-brand/5 border border-brand/10 rounded-xl p-4">
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Vehicles Registered</span>
                    <span className="text-xl font-mono font-extrabold text-foreground">{selectedOwner.vehiclesCount}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block">Fleet Total Revenue</span>
                    <span className="text-xl font-mono font-extrabold text-brand">{naira(selectedOwner.totalRevenue)}</span>
                  </div>
                </div>

                {/* Fleet List */}
                <div>
                  <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Owned Vehicles performance</h4>
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-surface text-[9px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border">
                          <th className="px-4 py-2">Vehicle ID</th>
                          <th className="px-4 py-2">Plate Number</th>
                          <th className="px-4 py-2 text-right">Distance (KM)</th>
                          <th className="px-4 py-2 text-right">Revenue</th>
                          <th className="px-4 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border font-medium">
                        {selectedOwner.vehicles.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">
                              No vehicles assigned to this owner yet.
                            </td>
                          </tr>
                        ) : (
                          selectedOwner.vehicles.map(v => (
                            <tr key={v.id} className="hover:bg-surface/30">
                              <td className="px-4 py-2.5 font-mono text-brand">{v.id.toUpperCase()}</td>
                              <td className="px-4 py-2.5 font-mono text-muted-foreground">{v.plateNumber}</td>
                              <td className="px-4 py-2.5 text-right font-mono">{v.totalDistance?.toFixed(1) || "0.0"} KM</td>
                              <td className="px-4 py-2.5 text-right font-mono text-foreground">{compactNaira(v.totalRevenue || 0)}</td>
                              <td className="px-4 py-2.5 text-right">
                                <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase", 
                                  v.status === "ACTIVE" ? "bg-brand/10 text-brand" : "bg-gray-100 text-gray-500"
                                )}>
                                  {v.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface text-sm font-semibold transition-colors"
                  >
                    Close Dashboard
                  </button>
                </div>
              </div>
            ) : (
              // Add/Edit Form Mode
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
                    <svg className="size-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMsg}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Investor/Company Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      placeholder="e.g. CityView Katsina"
                      required
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      value={formData.name}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Email Address (Workspace Username)*
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="e.g. cityview@muvamobility.com"
                      required
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                      value={formData.email}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Contact Phone*
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="e.g. 08044444444"
                      required
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>

                  {modalMode === "add" && (
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Portal Password*
                      </label>
                      <input
                        type="text"
                        name="password"
                        placeholder="Rydex123"
                        required
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                        value={formData.password}
                        onChange={handleInputChange}
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-border mt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface text-sm font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-5 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                  >
                    {isPending && (
                      <svg className="animate-spin size-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {modalMode === "add" ? "Register Investor" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
