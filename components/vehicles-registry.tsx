"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { 
  createVehicleAction, 
  updateVehicleAction, 
  disableVehicleAction 
} from "@/app/actions";

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
}

interface Vehicle {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  fuelType: string;
  plateNumber: string;
  status: string;
  assignedDriverId: string | null;
  ownerId: string | null;
  assignedDriver?: Driver | null;
  owner?: User | null;
}

interface VehiclesRegistryProps {
  initialVehicles: Vehicle[];
  drivers: Driver[];
  owners: User[];
  currentUser?: { id: string; name: string; role: string };
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-brand/10 text-brand border border-brand/20",
  MAINTENANCE: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  OFFLINE: "bg-gray-100 text-gray-500 border border-gray-200",
};

export function VehiclesRegistry({ initialVehicles, drivers, owners, currentUser }: VehiclesRegistryProps) {
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  
  // Form State
  const [errorMsg, setErrorMsg] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    vehicleNumber: "",
    plateNumber: "",
    vehicleType: "Keke Napep",
    fuelType: "CNG",
    ownerId: "",
    assignedDriverId: "",
    status: "ACTIVE",
  });

  const handleOpenAddModal = () => {
    setErrorMsg("");
    setFormData({
      id: "",
      vehicleNumber: "",
      plateNumber: "",
      vehicleType: "Keke Napep",
      fuelType: "CNG",
      ownerId: "",
      assignedDriverId: "",
      status: "ACTIVE",
    });
    setModalMode("add");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle: Vehicle) => {
    setErrorMsg("");
    setSelectedVehicle(vehicle);
    setFormData({
      id: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      fuelType: vehicle.fuelType,
      ownerId: vehicle.ownerId || "",
      assignedDriverId: vehicle.assignedDriverId || "",
      status: vehicle.status,
    });
    setModalMode("edit");
    setIsModalOpen(true);
  };

  const handleOpenViewModal = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setModalMode("view");
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVehicle(null);
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
        res = await createVehicleAction(null, fd);
      } else {
        res = await updateVehicleAction(null, fd);
      }

      if (res.success) {
        // Optimistic / Local UI update to prevent full reload lag
        if (modalMode === "add") {
          const matchedDriver = drivers.find(d => d.id === formData.assignedDriverId) || null;
          const matchedOwner = owners.find(o => o.id === formData.ownerId) || null;
          const newV: Vehicle = {
            id: formData.id.toLowerCase().trim(),
            vehicleNumber: formData.vehicleNumber.trim(),
            plateNumber: formData.plateNumber.trim(),
            vehicleType: formData.vehicleType,
            fuelType: formData.fuelType,
            status: formData.status,
            assignedDriverId: formData.assignedDriverId || null,
            ownerId: formData.ownerId || null,
            assignedDriver: matchedDriver,
            owner: matchedOwner,
          };
          setVehicles([newV, ...vehicles]);
        } else {
          setVehicles(prev => prev.map(v => {
            if (v.id === formData.id) {
              const matchedDriver = drivers.find(d => d.id === formData.assignedDriverId) || null;
              const matchedOwner = owners.find(o => o.id === formData.ownerId) || null;
              return {
                ...v,
                vehicleNumber: formData.vehicleNumber,
                plateNumber: formData.plateNumber,
                vehicleType: formData.vehicleType,
                fuelType: formData.fuelType,
                status: formData.status,
                assignedDriverId: formData.assignedDriverId || null,
                ownerId: formData.ownerId || null,
                assignedDriver: matchedDriver,
                owner: matchedOwner,
              };
            }
            return v;
          }));
        }
        handleCloseModal();
      } else {
        setErrorMsg(res.error || "An error occurred. Please try again.");
      }
    });
  };

  const handleDisableVehicle = async (id: string) => {
    if (!confirm("Are you sure you want to set this vehicle offline?")) return;
    
    const res = await disableVehicleAction(id);
    if (res.success) {
      setVehicles(prev => prev.map(v => v.id === id ? { ...v, status: "OFFLINE" } : v));
    } else {
      alert(res.error || "Failed to disable vehicle.");
    }
  };

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = 
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.assignedDriver?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.owner?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;
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
              placeholder="Search by ID, plate, owner, driver..."
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
            <option value="ACTIVE">Active</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>

        {currentUser?.role !== "OPERATIONS_OFFICER" && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm font-semibold rounded-lg shadow-sm transition-all shrink-0 active:scale-95"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Register Vehicle
          </button>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm animate-fade-up">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border">
                <th className="px-6 py-3">Vehicle ID</th>
                <th className="px-6 py-3 hidden sm:table-cell">Plate Number</th>
                <th className="px-6 py-3 hidden md:table-cell">Type</th>
                <th className="px-6 py-3 hidden md:table-cell">Fuel</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Driver</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-border">
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-muted-foreground">
                    No vehicles found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-brand">
                      {v.id.toUpperCase()}
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell font-mono text-muted-foreground">
                      {v.plateNumber}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">{v.vehicleType}</td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-brand/5 text-brand text-[10px] font-bold rounded">
                        {v.fuelType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {v.owner ? (
                        <span className="font-medium text-foreground">{v.owner.name}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {v.assignedDriver ? (
                        <span className="font-medium text-foreground">{v.assignedDriver.name}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider", STATUS_TONE[v.status])}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenViewModal(v)}
                          className="p-1 hover:bg-surface rounded text-muted-foreground hover:text-foreground transition-colors"
                          title="View Details"
                        >
                          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="p-1 hover:bg-surface rounded text-muted-foreground hover:text-brand transition-colors"
                          title="Edit Vehicle"
                        >
                          <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {v.status !== "OFFLINE" && currentUser?.role !== "OPERATIONS_OFFICER" && (
                          <button
                            onClick={() => handleDisableVehicle(v.id)}
                            className="p-1 hover:bg-surface rounded text-muted-foreground hover:text-red-600 transition-colors"
                            title="Disable Vehicle"
                          >
                            <svg className="size-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
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
          {/* Modal Card */}
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-up border border-border">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between border-b border-gray-800">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {modalMode === "add" && "Register New Vehicle"}
                {modalMode === "edit" && `Edit Vehicle: ${formData.id.toUpperCase()}`}
                {modalMode === "view" && `Vehicle Details: ${selectedVehicle?.id.toUpperCase()}`}
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

            {/* Modal Content */}
            {modalMode === "view" && selectedVehicle ? (
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vehicle ID</span>
                    <span className="font-mono text-base font-semibold text-brand">{selectedVehicle.id.toUpperCase()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Plate Number</span>
                    <span className="font-mono text-base font-semibold text-foreground">{selectedVehicle.plateNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vehicle Number</span>
                    <span className="font-mono text-base font-semibold text-foreground">{selectedVehicle.vehicleNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Status</span>
                    <span className={cn("px-2 py-0.5 text-[10px] font-bold rounded inline-block uppercase tracking-wider mt-1", STATUS_TONE[selectedVehicle.status])}>
                      {selectedVehicle.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Vehicle Type</span>
                    <span className="text-sm font-medium text-foreground">{selectedVehicle.vehicleType}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Fuel Type</span>
                    <span className="text-sm font-medium text-foreground">{selectedVehicle.fuelType}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-surface/50 p-3 rounded-lg border border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Fleet Owner</span>
                    {selectedVehicle.owner ? (
                      <div>
                        <div className="font-semibold text-foreground text-sm">{selectedVehicle.owner.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{selectedVehicle.owner.phone}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No fleet owner assigned.</span>
                    )}
                  </div>
                  <div className="bg-surface/50 p-3 rounded-lg border border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Assigned Driver</span>
                    {selectedVehicle.assignedDriver ? (
                      <div>
                        <div className="font-semibold text-foreground text-sm">{selectedVehicle.assignedDriver.name}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{selectedVehicle.assignedDriver.phone}</div>
                        <div className="text-[10px] uppercase font-bold text-brand mt-1">{selectedVehicle.assignedDriver.status}</div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No driver assigned.</span>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 border border-border rounded-lg hover:bg-surface text-sm font-semibold transition-colors"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            ) : (
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
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Vehicle ID (Unique Code)*
                    </label>
                    <input
                      type="text"
                      name="id"
                      placeholder="e.g. ryd-kt-015"
                      required
                      disabled={modalMode === "edit" || currentUser?.role === "OPERATIONS_OFFICER"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono uppercase disabled:bg-gray-50 disabled:text-muted-foreground"
                      value={formData.id}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Vehicle Number*
                    </label>
                    <input
                      type="text"
                      name="vehicleNumber"
                      placeholder="e.g. KT-015"
                      required
                      disabled={currentUser?.role === "OPERATIONS_OFFICER"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono uppercase disabled:bg-gray-50 disabled:text-muted-foreground"
                      value={formData.vehicleNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Plate Number*
                    </label>
                    <input
                      type="text"
                      name="plateNumber"
                      placeholder="e.g. KAT-115-XA"
                      required
                      disabled={currentUser?.role === "OPERATIONS_OFFICER"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand font-mono uppercase disabled:bg-gray-50 disabled:text-muted-foreground"
                      value={formData.plateNumber}
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
                      <option value="ACTIVE">Active</option>
                      <option value="MAINTENANCE">Maintenance</option>
                      <option value="OFFLINE">Offline</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Vehicle Type
                    </label>
                    <select
                      name="vehicleType"
                      disabled={currentUser?.role === "OPERATIONS_OFFICER"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white disabled:bg-gray-50 disabled:text-muted-foreground"
                      value={formData.vehicleType}
                      onChange={handleInputChange}
                    >
                      <option value="Keke Napep">Keke Napep</option>
                      <option value="Mini-Bus">Mini-Bus</option>
                      <option value="CNG Tricycle">CNG Tricycle</option>
                      <option value="Electric Bike">Electric Bike</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Fuel Type
                    </label>
                    <select
                      name="fuelType"
                      disabled={currentUser?.role === "OPERATIONS_OFFICER"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white disabled:bg-gray-50 disabled:text-muted-foreground"
                      value={formData.fuelType}
                      onChange={handleInputChange}
                    >
                      <option value="CNG">CNG (Natural Gas)</option>
                      <option value="EV">EV (Electric)</option>
                      <option value="Petrol">Petrol</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mt-2 space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Assign Fleet Owner
                    </label>
                    <select
                      name="ownerId"
                      disabled={currentUser?.role === "OPERATIONS_OFFICER"}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white disabled:bg-gray-50 disabled:text-muted-foreground"
                      value={formData.ownerId}
                      onChange={handleInputChange}
                    >
                      <option value="">No Owner (SaaS Default)</option>
                      {owners.map(o => (
                        <option key={o.id} value={o.id}>{o.name} ({o.phone})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                      Assign Driver
                    </label>
                    <select
                      name="assignedDriverId"
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand bg-white"
                      value={formData.assignedDriverId}
                      onChange={handleInputChange}
                    >
                      <option value="">No Driver Assigned</option>
                      {/* Filter to available drivers, or display current driver if editing */}
                      {drivers.map(d => {
                        const isAssignedToOther = vehicles.some(v => v.assignedDriverId === d.id && v.id !== formData.id);
                        if (isAssignedToOther) return null;
                        return (
                          <option key={d.id} value={d.id}>
                            {d.name} {d.status === "suspended" ? "(SUSPENDED)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
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
                    {modalMode === "add" ? "Register Vehicle" : "Save Changes"}
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
