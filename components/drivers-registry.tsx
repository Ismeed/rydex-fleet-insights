"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { compactNaira } from "@/lib/format";
import { 
  createDriverAction, 
  updateDriverAction, 
  suspendDriverAction 
} from "@/app/actions";

interface Vehicle {
  id: string;
  plateNumber: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  address: string;
  guarantorName: string;
  guarantorPhone: string;
  status: string;
  avgPerDay: number;
  avgPerHour: number;
  assignedVehicle: Vehicle | null;
}

interface DriversRegistryProps {
  initialDrivers: Driver[];
}

export function DriversRegistry({ initialDrivers }: DriversRegistryProps) {
  const [drivers, setDrivers] = useState<Driver[]>(initialDrivers);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Form State
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    phone: "",
    address: "",
    guarantorName: "",
    guarantorPhone: "",
    status: "active",
  });

  const handleOpenAddModal = () => {
    setErrorMsg("");
    setFormData({
      id: "",
      name: "",
      phone: "",
      address: "",
      guarantorName: "",
      guarantorPhone: "",
      status: "active",
    });
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver: Driver, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setErrorMsg("");
    setSelectedDriver(driver);
    setFormData({
      id: driver.id,
      name: driver.name,
      phone: driver.phone,
      address: driver.address,
      guarantorName: driver.guarantorName,
      guarantorPhone: driver.guarantorPhone,
      status: driver.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (driver: Driver) => {
    setSelectedDriver(driver);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDriver(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        res = await createDriverAction(null, fd);
      } else {
        res = await updateDriverAction(null, fd);
      }

      if (res.success) {
        // Local state update
        if (modalMode === "add") {
          const newD: Driver = {
            id: `drv-${Date.now()}`,
            name: formData.name,
            phone: formData.phone,
            address: formData.address,
            guarantorName: formData.guarantorName,
            guarantorPhone: formData.guarantorPhone,
            status: formData.status,
            avgPerDay: 8500,
            avgPerHour: 1000,
            assignedVehicle: null,
          };
          setDrivers([newD, ...drivers]);
        } else {
          setDrivers(prev => prev.map(d => {
            if (d.id === formData.id) {
              return {
                ...d,
                name: formData.name,
                phone: formData.phone,
                address: formData.address,
                guarantorName: formData.guarantorName,
                guarantorPhone: formData.guarantorPhone,
                status: formData.status,
              };
            }
            return d;
          }));
        }
        handleCloseModal();
      } else {
        setErrorMsg(res.error || "An error occurred. Please try again.");
      }
    });
  };

  const handleSuspendDriver = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Are you sure you want to suspend this driver?")) return;

    const res = await suspendDriverAction(id);
    if (res.success) {
      setDrivers(prev => prev.map(d => d.id === id ? { ...d, status: "suspended" } : d));
    } else {
      alert(res.error || "Failed to suspend driver.");
    }
  };

  // Filters
  const filteredDrivers = drivers.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.includes(searchTerm) ||
      d.guarantorName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
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
              placeholder="Search by driver name, phone, guarantor..."
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
            <option value="off-duty">Off-Duty</option>
          </select>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0 active:scale-95"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Driver
        </button>
      </div>

      {/* Roster Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-fade-up">
        {filteredDrivers.length === 0 ? (
          <div className="col-span-full bg-white border border-border rounded-xl p-10 text-center text-muted-foreground">
            No drivers found matching your search.
          </div>
        ) : (
          filteredDrivers.map((d) => (
            <div 
              key={d.id} 
              onClick={() => handleOpenViewModal(d)}
              className="bg-white border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group hover:border-brand/35"
            >
              <div>
                <div className="flex items-start justify-between mb-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-brand/10 text-brand grid place-items-center font-bold text-sm shrink-0 group-hover:bg-brand group-hover:text-white transition-all">
                      {d.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold truncate hover:text-brand block text-foreground">
                        {d.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono truncate">{d.phone}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "px-2.5 py-1 text-[9px] font-extrabold rounded uppercase shrink-0 tracking-wider border",
                      d.status === "active" 
                        ? "bg-brand/10 text-brand border-brand/20" 
                        : d.status === "suspended"
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-gray-100 text-gray-500 border-gray-200",
                    )}
                  >
                    {d.status}
                  </span>
                </div>

                <div className="text-xs space-y-1.5 text-muted-foreground my-3 border-t border-border pt-3">
                  <p><span className="font-bold text-foreground">Guarantor:</span> {d.guarantorName || "None"}</p>
                  <p className="font-mono"><span className="font-bold text-foreground font-sans">G-Phone:</span> {d.guarantorPhone || "N/A"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border mt-2">
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Vehicle</p>
                  {d.assignedVehicle ? (
                    <span className="text-xs font-mono mt-0.5 text-brand font-bold block">
                      {d.assignedVehicle.id.toUpperCase()}
                    </span>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">—</p>
                  )}
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Avg / Day</p>
                  <p className="text-xs font-mono font-bold mt-0.5 text-foreground">{compactNaira(d.avgPerDay)}</p>
                </div>
              </div>

              {/* Hover Edit/Suspend actions */}
              <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-border/60">
                <button
                  onClick={(e) => handleOpenEditModal(d, e)}
                  className="px-3 py-1 bg-surface border border-border rounded text-xs font-semibold text-muted-foreground hover:text-brand hover:border-brand/40 transition-colors"
                >
                  Edit
                </button>
                {d.status !== "suspended" && (
                  <button
                    onClick={(e) => handleSuspendDriver(d.id, e)}
                    className="px-3 py-1 bg-red-50 border border-red-200 rounded text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
                  >
                    Suspend
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Backend */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          {/* Modal Box */}
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-up border border-border">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <h3 className="font-bold text-lg">
                {modalMode === "add" && "Register New Driver"}
                {modalMode === "edit" && `Edit Driver: ${selectedDriver?.name}`}
                {modalMode === "view" && `Driver Profile: ${selectedDriver?.name}`}
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

            {/* View Profile */}
            {modalMode === "view" && selectedDriver ? (
              <div className="p-6 space-y-5">
                <div className="flex items-center gap-4 border-b border-border pb-4">
                  <div className="size-14 rounded-full bg-brand/10 text-brand grid place-items-center font-bold text-lg">
                    {selectedDriver.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-foreground">{selectedDriver.name}</h4>
                    <p className="text-xs font-mono text-muted-foreground">{selectedDriver.phone}</p>
                    <span className={cn("px-2.5 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider inline-block mt-1.5 border", STATUS_TONE_CLASS(selectedDriver.status))}>
                      {selectedDriver.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Residential Address</span>
                    <span className="text-sm font-medium text-foreground">{selectedDriver.address || "No address listed"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Guarantor Name</span>
                    <span className="text-sm font-medium text-foreground">{selectedDriver.guarantorName || "None"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Guarantor Phone</span>
                    <span className="text-sm font-mono text-foreground">{selectedDriver.guarantorPhone || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Vehicle</span>
                    {selectedDriver.assignedVehicle ? (
                      <span className="text-sm font-mono font-bold text-brand block mt-0.5">{selectedDriver.assignedVehicle.id.toUpperCase()}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground block mt-0.5">No assigned vehicle</span>
                    )}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Rydex Performance (Avg/Day)</span>
                    <span className="text-sm font-mono font-bold text-foreground block mt-0.5">{compactNaira(selectedDriver.avgPerDay)}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface text-sm font-semibold transition-colors"
                  >
                    Close Profile
                  </button>
                </div>
              </div>
            ) : (
              // Add/Edit Form
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
                    <svg className="size-4 shrink-0 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Driver Full Name*
                      </label>
                      <input
                        type="text"
                        name="name"
                        placeholder="e.g. Ibrahim Hassan"
                        required
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                        value={formData.name}
                        onChange={handleInputChange}
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Phone Number*
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="e.g. +234 803 555 0101"
                        required
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                        value={formData.phone}
                        onChange={handleInputChange}
                      />
                    </div>

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
                        <option value="off-duty">Off-Duty</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                        Home Address
                      </label>
                      <textarea
                        name="address"
                        rows={2}
                        placeholder="Residential address in Katsina..."
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                        value={formData.address}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div className="border-t border-border pt-4 mt-2">
                    <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider text-brand">Guarantor Verification Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Guarantor Name
                        </label>
                        <input
                          type="text"
                          name="guarantorName"
                          placeholder="Name of guarantor"
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                          value={formData.guarantorName}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                          Guarantor Phone
                        </label>
                        <input
                          type="tel"
                          name="guarantorPhone"
                          placeholder="Guarantor mobile number"
                          className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono"
                          value={formData.guarantorPhone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
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
                    {modalMode === "add" ? "Register Driver" : "Save Changes"}
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

function STATUS_TONE_CLASS(status: string) {
  if (status === "active") return "bg-brand/10 text-brand border-brand/20";
  if (status === "suspended") return "bg-red-50 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-500 border-gray-200";
}
